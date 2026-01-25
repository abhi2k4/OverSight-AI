import sys
import os

# Ensure backend exists in python path
sys.path.append(os.getcwd())

from backend.ingestion.pipeline import IngestionPipeline
from backend.ingestion.factory import SourceFactory

def run_test():
    print("--- Starting Test Run of Dynamic Ingestion ---")

    # 1. Define Inputs (The Test Data)
    # We pass 'entity_type' here to tell the system what this data represents
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

    # 2. Instantiate and Run
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

    # 3. Execute Pipeline (writes JSONL output)
    pipeline = IngestionPipeline(sources, output_dir="output")
    pipeline.run()
    
    print("--- Test Run Complete ---")

if __name__ == "__main__":
    run_test()
