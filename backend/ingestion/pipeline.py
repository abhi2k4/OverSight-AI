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
                entity_type = source.get_entity_type()
                self._save_batch(source.get_source_name(), entity_type, data)
                total_records += len(data)
                
            except Exception as e:
                print(f"Error processing {source.get_source_name()}: {e}")
        
        print(f"Pipeline Complete. Total records ingested: {total_records}")

    def _save_batch(self, source_name: str, entity_type: str, records: List[dict]):
        for record_data in records:
            # Basic validation or transformation could happen here
            
            unified_record = UnifiedRecord(
                source_system=source_name,
                entity_type=entity_type,
                raw_data=record_data
            )
            self.db.add(unified_record)
        
        self.db.commit()
        print(f"Saved batch to Unified Storage.")
