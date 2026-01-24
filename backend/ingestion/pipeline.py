from sqlalchemy.orm import Session
from backend.models import UnifiedRecord
from backend.ingestion.sources.base import DataSource
from typing import List

class IngestionPipeline:
    def __init__(self, db_session: Session, sources: List[DataSource]):
        self.db = db_session
        self.sources = sources

    def run(self):
        print("Starting Ingestion Pipeline...")
        total_records = 0
        
        for source in self.sources:
            print(f"--- Processing Source: {source.get_source_name()} ---")
            try:
                source.connect()
                data = source.fetch_data()
                
                print(f"Fetched {len(data)} records.")
                self._save_batch(source.get_source_name(), data)
                total_records += len(data)
                
            except Exception as e:
                print(f"Error processing {source.get_source_name()}: {e}")
        
        print(f"Pipeline Complete. Total records ingested: {total_records}")

    def _save_batch(self, source_name: str, records: List[dict]):
        for record_data in records:
            # Basic validation or transformation could happen here
            
            # Determine entity type broadly based on source (heuristic)
            entity_type = "unknown"
            if "product" in source_name:
                entity_type = "product"
            elif "sales" in source_name:
                entity_type = "transaction"
            elif "user" in source_name:
                entity_type = "user"

            unified_record = UnifiedRecord(
                source_system=source_name,
                entity_type=entity_type,
                raw_data=record_data
            )
            self.db.add(unified_record)
        
        self.db.commit()
        print(f"Saved batch to Unified Storage.")
