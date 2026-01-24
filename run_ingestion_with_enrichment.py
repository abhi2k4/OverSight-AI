"""
Complete ingestion + enrichment workflow
Ingests data from sources and automatically enriches it
"""

import sys
import os
import asyncio

# Ensure backend exists in python path
sys.path.append(os.getcwd())

from backend.ingestion.pipeline import IngestionPipeline
from backend.ingestion.factory import SourceFactory
from backend.ingestion.enrichment_bridge import EnrichmentBridge
from backend.database import init_db

from dotenv import load_dotenv

load_dotenv()

async def run_complete_workflow():
    """Run complete ingestion + enrichment workflow"""
    print("=" * 70)
    print("OverSight: Complete Ingestion + Enrichment Workflow")
    print("=" * 70)
    print()
    
    # Initialize database
    init_db()
    print("✅ Database initialized\n")
    
    # Step 1: Data Ingestion
    print("STEP 1: Data Ingestion")
    print("-" * 70)
    
    # Define data sources
    test_inputs = [
        {
            "type": "sqlite", 
            "config": {
                "file_path": "data/products.db"
            }
        },
        {
            "type": "json", 
            "config": {
                "file_path": "data/sales.json",
                "entity_type": "sales_transaction"
            }
        },
        {
            "type": "csv", 
            "config": {
                "file_path": "data/users.csv",
                "entity_type": "system_user"
            }
        }
    ]
    
    # Create sources
    sources = []
    for input_def in test_inputs:
        try:
            source = SourceFactory.create(input_def["type"], input_def["config"])
            sources.append(source)
        except Exception as e:
            print(f"[WARN] Could not create source for {input_def}: {e}")
    
    if not sources:
        print("❌ No valid sources found. Exiting.")
        return
    
    # Run ingestion pipeline
    pipeline = IngestionPipeline(sources, output_dir="output")
    pipeline.run()
    
    print("\n✅ Ingestion complete\n")
    
    # Step 2: AI Enrichment
    print("STEP 2: AI Enrichment")
    print("-" * 70)
    
    # Create enrichment bridge
    bridge = EnrichmentBridge(output_dir="output")
    
    try:
        # Check if GEMINI_API_KEY is set
        if not os.getenv("GEMINI_API_KEY"):
            print("⚠️  Warning: GEMINI_API_KEY not set in environment")
            print("⚠️  Skipping enrichment. Set the API key to enable enrichment.")
            print()
            print("To enable enrichment:")
            print("  1. Get a Gemini API key from https://ai.google.dev/")
            print("  2. Set it in your environment: export GEMINI_API_KEY=your_key")
            print("  3. Run this script again")
            return
        
        # Process all ingested data
        stats = await bridge.process_all(batch_size=10)
        
        print("\n✅ Enrichment complete\n")
        
        # Step 3: Summary
        print("=" * 70)
        print("Workflow Complete - Summary")
        print("=" * 70)
        print(f"Data Sources Processed: {len(sources)}")
        print(f"JSONL Files Found: {stats.get('files_processed', 0)}")
        print(f"Total Records: {stats.get('total_records', 0)}")
        print(f"Successfully Enriched: {stats.get('enriched', 0)}")
        print(f"Failed: {stats.get('failed', 0)}")
        print(f"Skipped (duplicates): {stats.get('skipped', 0)}")
        print()
        
        if stats.get('enriched', 0) > 0:
            print("✅ All data ingested and enriched successfully!")
            print()
            print("Next steps:")
            print("  1. Start the API server: python backend/api/main.py")
            print("  2. Query enriched data: http://localhost:8000/api/enriched")
            print("  3. Browse collections: http://localhost:8000/api/collections")
            print("  4. View API docs: http://localhost:8000/docs")
        
    except KeyboardInterrupt:
        print("\n❌ Process interrupted by user")
    except Exception as e:
        print(f"\n❌ Error during enrichment: {e}")
        import traceback
        traceback.print_exc()
    finally:
        bridge.close()


if __name__ == "__main__":
    asyncio.run(run_complete_workflow())
