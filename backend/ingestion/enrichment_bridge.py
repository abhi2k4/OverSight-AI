"""
Bridge module to connect ingestion pipeline with enrichment API
Reads JSONL output from ingestion and automatically enriches records
"""

import json
import os
import asyncio
from pathlib import Path
from typing import List, Dict, Any
from datetime import datetime

import sys
sys.path.append(os.path.join(os.path.dirname(__file__), '../..'))

from backend.api.enrichment_service import EnrichmentService
from backend.database import SessionLocal, init_db
from backend.models import EnrichedRecord
from backend.api.config import settings


class EnrichmentBridge:
    """Bridge between ingestion pipeline and enrichment service"""
    
    def __init__(self, output_dir: str = "output"):
        """
        Initialize the enrichment bridge
        
        Args:
            output_dir: Directory containing ingestion output
        """
        self.output_dir = Path(output_dir)
        self.enrichment_service = EnrichmentService()
        self.db = SessionLocal()
        
    def find_jsonl_files(self) -> List[Path]:
        """Find all JSONL files from ingestion output"""
        jsonl_files = []
        
        if not self.output_dir.exists():
            print(f"Output directory {self.output_dir} does not exist")
            return jsonl_files
        
        # Walk through output directory structure
        # Expected: output/{source_name}/{entity_type}/{date_key}/data.jsonl
        for jsonl_file in self.output_dir.rglob("data.jsonl"):
            jsonl_files.append(jsonl_file)
        
        return jsonl_files
    
    def parse_jsonl_file(self, file_path: Path) -> List[Dict[str, Any]]:
        """
        Parse JSONL file and extract records with metadata
        
        Args:
            file_path: Path to JSONL file
            
        Returns:
            List of records with source and entity metadata
        """
        records = []
        
        # Extract metadata from path
        # Example: output/product_db/product/2024-01-24/data.jsonl
        parts = file_path.parts
        
        if len(parts) >= 4:
            source_system = parts[-4]
            entity_type = parts[-3]
        else:
            source_system = "unknown"
            entity_type = "unknown"
        
        # Read JSONL file
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                for line in f:
                    line = line.strip()
                    if line:
                        try:
                            raw_data = json.loads(line)
                            records.append({
                                "source_system": source_system,
                                "entity_type": entity_type,
                                "raw_data": raw_data
                            })
                        except json.JSONDecodeError as e:
                            print(f"Error parsing line in {file_path}: {e}")
        except Exception as e:
            print(f"Error reading file {file_path}: {e}")
        
        return records
    
    async def enrich_and_store(self, records: List[Dict[str, Any]], batch_size: int = 10, upload_metadata: Dict[str, Dict[str, Any]] = None) -> Dict[str, int]:
        """
        Enrich records and store in database
        
        Args:
            records: List of records to enrich
            batch_size: Number of records to process in each batch
            upload_metadata: User-specified metadata (sensitivity, compliance) by entity_type
            
        Returns:
            Statistics dictionary with counts
        """
        if upload_metadata is None:
            upload_metadata = {}
            
        stats = {
            "total": len(records),
            "enriched": 0,
            "failed": 0,
            "skipped": 0
        }
        
        # Process in batches
        for i in range(0, len(records), batch_size):
            batch = records[i:i + batch_size]
            
            print(f"Processing batch {i // batch_size + 1} ({len(batch)} records)...")
            
            # Get user-specified metadata for this batch
            batch_metadata = {}
            for record in batch:
                entity_type = record.get("entity_type", "")
                if entity_type in upload_metadata:
                    batch_metadata[entity_type] = upload_metadata[entity_type]
            
            # Enrich batch with user metadata
            results = await self.enrichment_service.enrich_records_batch(
                records=batch,
                parallel=True,
                max_concurrent=5,
                upload_metadata=batch_metadata
            )
            
            # Save successful enrichments
            for result in results:
                if result["success"]:
                    record = result["record"]
                    metadata = result["metadata"]
                    
                    # Check if record already enriched (avoid duplicates)
                    existing = self.db.query(EnrichedRecord).filter(
                        EnrichedRecord.source_system == record["source_system"],
                        EnrichedRecord.entity_type == record["entity_type"],
                        EnrichedRecord.raw_data == json.dumps(record["raw_data"], sort_keys=True)
                    ).first()
                    
                    if existing:
                        stats["skipped"] += 1
                        continue
                    
                    # Create new enriched record
                    enriched_record = EnrichedRecord(
                        source_system=record["source_system"],
                        entity_type=record["entity_type"],
                        raw_data=record["raw_data"],
                        enriched_metadata=metadata.model_dump(),
                        enrichment_timestamp=datetime.utcnow(),
                        enrichment_version=settings.enrichment_version
                    )
                    
                    self.db.add(enriched_record)
                    stats["enriched"] += 1
                else:
                    stats["failed"] += 1
                    print(f"Failed to enrich record: {result.get('error', 'Unknown error')}")
            
            # Commit batch
            try:
                self.db.commit()
                print(f"✅ Batch committed ({stats['enriched']} enriched so far)")
            except Exception as e:
                self.db.rollback()
                print(f"❌ Error committing batch: {e}")
        
        return stats
    
    def load_upload_metadata(self) -> Dict[str, Dict[str, Any]]:
        """Load user-specified metadata (sensitivity, compliance) from metadata.json"""
        metadata_file = self.output_dir / "metadata.json"
        if metadata_file.exists():
            try:
                with open(metadata_file, 'r') as f:
                    return json.load(f)
            except Exception as e:
                print(f"Warning: Could not load metadata.json: {e}")
        return {}
    
    async def process_all(self, batch_size: int = 10) -> Dict[str, Any]:
        """
        Process all JSONL files from ingestion output
        
        Args:
            batch_size: Number of records to process in each batch
            
        Returns:
            Processing statistics
        """
        print("=" * 60)
        print("Enrichment Bridge - Auto-enriching Ingested Data")
        print("=" * 60)
        print()
        
        # Load user-specified metadata (sensitivity, compliance)
        upload_metadata = self.load_upload_metadata()
        if upload_metadata:
            print(f"📋 Loaded user-specified metadata for {len(upload_metadata)} entity types")
        
        # Find all JSONL files
        jsonl_files = self.find_jsonl_files()
        print(f"📁 Found {len(jsonl_files)} JSONL files\n")
        
        if not jsonl_files:
            return {
                "files_processed": 0,
                "total_records": 0,
                "enriched": 0,
                "failed": 0,
                "skipped": 0
            }
        
        total_stats = {
            "files_processed": 0,
            "total_records": 0,
            "enriched": 0,
            "failed": 0,
            "skipped": 0
        }
        
        # Process each file
        for jsonl_file in jsonl_files:
            print(f"📄 Processing: {jsonl_file}")
            
            # Parse records
            records = self.parse_jsonl_file(jsonl_file)
            print(f"   Found {len(records)} records")
            
            if not records:
                continue
            
            # Enrich and store with user metadata
            stats = await self.enrich_and_store(records, batch_size=batch_size, upload_metadata=upload_metadata)
            
            # Update totals
            total_stats["files_processed"] += 1
            total_stats["total_records"] += stats["total"]
            total_stats["enriched"] += stats["enriched"]
            total_stats["failed"] += stats["failed"]
            total_stats["skipped"] += stats["skipped"]
            
            print(f"   ✅ Enriched: {stats['enriched']}, Failed: {stats['failed']}, Skipped: {stats['skipped']}\n")
        
        print("=" * 60)
        print("Processing Complete")
        print("=" * 60)
        print(f"Files processed: {total_stats['files_processed']}")
        print(f"Total records: {total_stats['total_records']}")
        print(f"Successfully enriched: {total_stats['enriched']}")
        print(f"Failed: {total_stats['failed']}")
        print(f"Skipped (already enriched): {total_stats['skipped']}")
        print()
        
        return total_stats
    
    def close(self):
        """Close database connection"""
        self.db.close()


async def main():
    """Main entry point for enrichment bridge"""
    # Initialize database
    init_db()
    
    # Create bridge
    bridge = EnrichmentBridge(output_dir="output")
    
    try:
        # Process all ingested data
        stats = await bridge.process_all(batch_size=10)
        
        # Print final stats
        if stats["enriched"] > 0:
            print("✅ Enrichment bridge completed successfully!")
        elif stats["total_records"] == 0:
            print("ℹ️  No records found to enrich")
        else:
            print("⚠️  Enrichment completed with some failures")
        
    except KeyboardInterrupt:
        print("\n❌ Process interrupted by user")
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        bridge.close()


if __name__ == "__main__":
    asyncio.run(main())
