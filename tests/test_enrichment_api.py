import asyncio
import json
import sys
import os

# Ensure backend exists in python path
sys.path.append(os.getcwd())

from backend.api.enrichment_service import EnrichmentService
from backend.database import init_db
from backend.models import EnrichedRecord
from backend.database import SessionLocal
from backend.api.config import settings

from dotenv import load_dotenv

load_dotenv()

async def test_enrichment_service():
    """Test the enrichment service with sample data"""
    print("=== Testing Enrichment Service ===\n")
    
    # Initialize database
    init_db()
    print("✅ Database initialized\n")
    
    # Initialize enrichment service
    try:
        service = EnrichmentService()
        print("✅ Enrichment service initialized\n")
    except ValueError as e:
        print(f"❌ Error: {e}")
        print("Please set GEMINI_API_KEY environment variable")
        return
    
    # Test data - samples from different domains
    test_records = [
        {
            "source_system": "product_db",
            "entity_type": "product",
            "raw_data": {
                "id": 101,
                "name": "Laptop Pro 15",
                "price": 1299.99,
                "category": "electronics",
                "inventory": 45
            }
        },
        {
            "source_system": "sales_system",
            "entity_type": "transaction",
            "raw_data": {
                "transaction_id": "TXN-2024-001",
                "customer_name": "John Doe",
                "amount": 2499.50,
                "date": "2024-01-15",
                "items": ["Laptop", "Mouse", "Keyboard"]
            }
        },
        {
            "source_system": "hr_system",
            "entity_type": "employee",
            "raw_data": {
                "employee_id": "E12345",
                "name": "Jane Smith",
                "department": "Engineering",
                "salary": 95000,
                "email": "jane.smith@company.com"
            }
        }
    ]
    
    print("📝 Testing enrichment on sample records...\n")
    
    db = SessionLocal()
    
    try:
        for i, record in enumerate(test_records, 1):
            print(f"--- Record {i}/{len(test_records)} ---")
            print(f"Source: {record['source_system']}")
            print(f"Entity: {record['entity_type']}")
            print(f"Data: {json.dumps(record['raw_data'], indent=2)}\n")
            
            # Enrich the record
            enrichment = await service.enrich_record(
                source_system=record["source_system"],
                entity_type=record["entity_type"],
                raw_data=record["raw_data"]
            )
            
            print("🤖 AI Enrichment Result:")
            print(f"  Description: {enrichment.description}")
            print(f"  Tags: {', '.join(enrichment.tags)}")
            print(f"  Confidence: {enrichment.confidence:.2f}")
            print()
            
            # Save to database
            enriched_record = EnrichedRecord(
                source_system=record["source_system"],
                entity_type=record["entity_type"],
                raw_data=record["raw_data"],
                enriched_metadata=enrichment.model_dump(),
                enrichment_version=settings.enrichment_version
            )
            
            db.add(enriched_record)
            db.commit()
            db.refresh(enriched_record)
            
            print(f"💾 Saved to database with ID: {enriched_record.id}\n")
        
        print("=" * 50)
        print("✅ All records enriched successfully!")
        print("=" * 50)
        print()
        
        # Query test
        print("=== Testing Database Queries ===\n")
        
        # Get all records
        all_records = db.query(EnrichedRecord).all()
        print(f"Total enriched records: {len(all_records)}")
        
        # Group by tags
        tag_counts = {}
        for record in all_records:
            metadata = record.enriched_metadata
            tags = metadata.get("tags", [])
            for tag in tags:
                tag_counts[tag] = tag_counts.get(tag, 0) + 1
        
        print("\n📊 Tag Distribution:")
        for tag, count in sorted(tag_counts.items(), key=lambda x: x[1], reverse=True):
            print(f"  {tag}: {count}")
        
        print("\n✅ Phase 1 Complete: Core enrichment pipeline working!")
        
    except Exception as e:
        print(f"❌ Error during testing: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    asyncio.run(test_enrichment_service())
