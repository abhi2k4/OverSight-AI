"""
Orchestrator service for coordinating enrichment operations.
"""

from typing import List
from datetime import datetime, timezone
from sqlalchemy.orm import Session

from backend.api.schemas import RecordInput, EnrichedRecord as EnrichedRecordSchema
from backend.api.enrichment_service import EnrichmentService
from backend.api.config import settings
from backend.api.helpers import build_enriched_record_response
from backend.api.constants import MAX_CONCURRENT_REQUESTS
from backend.repositories.enriched_record_repository import EnrichedRecordRepository
from backend.models import EnrichedRecord


class EnrichmentOrchestrator:
    """
    Orchestrates the complete enrichment workflow:
    enrichment service call → database persistence → response building.
    """
    
    def __init__(
        self,
        enrichment_service: EnrichmentService,
        repository: EnrichedRecordRepository
    ):
        """
        Initialize orchestrator with dependencies.
        
        Args:
            enrichment_service: Service for AI enrichment
            repository: Repository for database operations
        """
        self.enrichment_service = enrichment_service
        self.repository = repository
    
    async def enrich_and_persist(
        self,
        records: List[RecordInput]
    ) -> tuple[List[EnrichedRecordSchema], int]:
        """
        Enrich records and persist to database.
        
        Args:
            records: List of input records to enrich
            
        Returns:
            Tuple of (enriched records list, failed count)
        """
        records_to_enrich = [
            {
                "source_system": r.source_system,
                "entity_type": r.entity_type,
                "raw_data": r.raw_data
            }
            for r in records
        ]
        
        enrichment_results = await self.enrichment_service.enrich_records_batch(
            records=records_to_enrich,
            parallel=(len(records) > 1),
            max_concurrent=MAX_CONCURRENT_REQUESTS
        )
        
        enriched_results = []
        failed_count = 0
        
        for i, result in enumerate(enrichment_results):
            if result["success"]:
                record_input = records[i]
                enrichment_metadata = result["metadata"]
                
                enriched_record = EnrichedRecord(
                    source_system=record_input.source_system,
                    entity_type=record_input.entity_type,
                    raw_data=record_input.raw_data,
                    enriched_metadata=enrichment_metadata.model_dump(),
                    enrichment_timestamp=datetime.now(timezone.utc),
                    enrichment_version=settings.enrichment_version
                )
                
                saved_record = self.repository.create(enriched_record)
                enriched_results.append(build_enriched_record_response(saved_record))
            else:
                failed_count += 1
                print(f"Failed to enrich record {i}: {result.get('error', 'Unknown error')}")
        
        return enriched_results, failed_count
