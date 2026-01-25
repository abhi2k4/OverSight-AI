"""
DataHub sync service for orchestrating metadata synchronization.
"""

import logging
from collections import defaultdict
from typing import Any, Dict, List, Optional

from sqlalchemy.orm import Session

from backend.repositories.enriched_record_repository import EnrichedRecordRepository
from .config import DataHubConfig
from .emitter import DataHubEmitter
from .mapper import DataHubMapper

logger = logging.getLogger(__name__)


class DataHubSyncService:
    """
    Orchestrates synchronization of enriched records to DataHub.
    """
    
    def __init__(
        self, 
        db: Session,
        config: Optional[DataHubConfig] = None
    ):
        """
        Initialize sync service.
        
        Args:
            db: Database session
            config: DataHub configuration
        """
        self.db = db
        self.config = config or DataHubConfig()
        self.repository = EnrichedRecordRepository(db)
        self.emitter = DataHubEmitter(self.config)
        self.mapper = DataHubMapper(self.config)
    
    def test_connection(self) -> bool:
        """
        Test connection to DataHub GMS.
        
        Returns:
            True if connection successful, False otherwise
        """
        return self.emitter.test_connection()
    
    def get_sync_stats(self) -> Dict[str, Any]:
        """
        Get statistics about data to be synced.
        
        Returns:
            Dictionary with sync statistics
        """
        # Get all sources
        all_records = self.repository.get_all_records()
        
        # Group by source
        sources = defaultdict(int)
        for record in all_records:
            sources[record.source_system] += 1
        
        return {
            "total_records": len(all_records),
            "total_sources": len(sources),
            "sources": dict(sources),
        }
    
    def sync_all(self) -> Dict[str, Any]:
        """
        Sync all enriched records to DataHub.
        
        Returns:
            Dictionary with sync results
        """
        logger.info("Starting full sync to DataHub")
        
        # Get all enriched records
        all_records = self.repository.get_all_records()
        
        if not all_records:
            logger.warning("No enriched records found to sync")
            return {
                "status": "success",
                "synced_sources": 0,
                "total_records": 0,
                "errors": []
            }
        
        # Group records by source system
        records_by_source = defaultdict(list)
        for record in all_records:
            # Convert SQLAlchemy model to dict
            record_dict = {
                "id": record.id,
                "source_system": record.source_system,
                "entity_type": record.entity_type,
                "raw_data": record.raw_data,
                "enriched_metadata": record.enriched_metadata,
                "ingestion_timestamp": record.ingestion_timestamp,
                "enrichment_timestamp": record.enrichment_timestamp,
                "enrichment_version": record.enrichment_version,
            }
            records_by_source[record.source_system].append(record_dict)
        
        logger.info(f"Found {len(records_by_source)} sources with {len(all_records)} total records")
        
        # Sync each source
        sync_results = {
            "status": "success",
            "synced_sources": 0,
            "total_records": len(all_records),
            "sources": {},
            "errors": []
        }
        
        for source_system, source_records in records_by_source.items():
            try:
                result = self.sync_source(source_system, source_records)
                sync_results["sources"][source_system] = result
                if result["success"]:
                    sync_results["synced_sources"] += 1
                else:
                    sync_results["errors"].extend(result.get("errors", []))
            except Exception as e:
                logger.error(f"Error syncing source {source_system}: {e}")
                sync_results["errors"].append({
                    "source": source_system,
                    "error": str(e)
                })
        
        if sync_results["errors"]:
            sync_results["status"] = "partial"
        
        logger.info(f"Sync complete: {sync_results['synced_sources']}/{len(records_by_source)} sources synced")
        return sync_results
    
    def sync_source(
        self, 
        source_system: str, 
        records: Optional[List[Dict[str, Any]]] = None
    ) -> Dict[str, Any]:
        """
        Sync a single source to DataHub.
        
        Args:
            source_system: Source system identifier
            records: Optional pre-fetched records (will query if None)
            
        Returns:
            Dictionary with sync results for this source
        """
        logger.info(f"Syncing source: {source_system}")
        
        # Fetch records if not provided
        if records is None:
            db_records = self.repository.get_all(source_system=source_system)
            records = [
                {
                    "id": r.id,
                    "source_system": r.source_system,
                    "entity_type": r.entity_type,
                    "raw_data": r.raw_data,
                    "enriched_metadata": r.enriched_metadata,
                    "ingestion_timestamp": r.ingestion_timestamp,
                    "enrichment_timestamp": r.enrichment_timestamp,
                    "enrichment_version": r.enrichment_version,
                }
                for r in db_records
            ]
        
        if not records:
            logger.warning(f"No records found for source: {source_system}")
            return {
                "success": False,
                "records_count": 0,
                "mcps_created": 0,
                "mcps_emitted": 0,
                "errors": [f"No records found for {source_system}"]
            }
        
        # Map records to MCPs
        try:
            mcps = self.mapper.map_source_to_dataset(source_system, records)
            logger.info(f"Created {len(mcps)} MCPs for {source_system}")
        except Exception as e:
            logger.error(f"Error mapping source {source_system}: {e}")
            return {
                "success": False,
                "records_count": len(records),
                "mcps_created": 0,
                "mcps_emitted": 0,
                "errors": [f"Mapping error: {str(e)}"]
            }
        
        # Emit MCPs
        try:
            emit_result = self.emitter.emit_batch(mcps)
            logger.info(f"Emitted {emit_result['success']}/{len(mcps)} MCPs for {source_system}")
            
            return {
                "success": emit_result["failed"] == 0,
                "records_count": len(records),
                "mcps_created": len(mcps),
                "mcps_emitted": emit_result["success"],
                "errors": emit_result.get("errors", [])
            }
        except Exception as e:
            logger.error(f"Error emitting MCPs for {source_system}: {e}")
            return {
                "success": False,
                "records_count": len(records),
                "mcps_created": len(mcps),
                "mcps_emitted": 0,
                "errors": [f"Emission error: {str(e)}"]
            }
    
    def close(self):
        """Close connections"""
        self.emitter.close()
