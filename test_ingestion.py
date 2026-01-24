import sys
import os

# Ensure backend exists in python path
sys.path.append(os.getcwd())

from backend.database import init_db, get_db
from backend.ingestion.pipeline import IngestionPipeline
from backend.ingestion.factory import SourceFactory

def run_test():
    print("--- Starting Test Run of Dynamic Ingestion ---")
    
    # 1. Initialize the unified database
    init_db()

    # 2. Define Inputs (The Test Data)
    # We pass 'entity_type' here to tell the system what this data represents
    test_inputs = [
        {
            "type": "sqlite", 
            "config": {
                "file_path": "data/products.db", 
                "table": "products",
                "entity_type": "product_catalog"
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

    # 3. Instantiate and Run
    sources = []
    for input_def in test_inputs:
        try:
            source = SourceFactory.create(input_def["type"], input_def["config"])
            sources.append(source)
        except Exception as e:
            print(f"[WARN] Could not create source for {input_def}: {e}")

    if not sources:
        print("No valid sources found. Exiting.")
        return

    # 4. Execute Pipeline
    db_gen = get_db()
    db_session = next(db_gen)
    
    try:
        pipeline = IngestionPipeline(db_session, sources)
        pipeline.run()
    finally:
        db_session.close()
    
    print("--- Test Run Complete ---")

if __name__ == "__main__":
    run_test()
