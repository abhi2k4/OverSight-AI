import sys
import os

# Ensure backend exists in python path
sys.path.append(os.getcwd())

from backend.database import init_db, get_db
from backend.ingestion.pipeline import IngestionPipeline
from backend.ingestion.sources import ProductSource, SalesSource, UserSource

def main():
    # 1. Initialize the unified database
    print("Initializing Database...")
    init_db()

    # 2. Setup Data Sources
    sources = [
        ProductSource(),
        SalesSource(),
        UserSource()
    ]

    # 3. Run Pipeline
    db_gen = get_db()
    db_session = next(db_gen)
    
    try:
        pipeline = IngestionPipeline(db_session, sources)
        pipeline.run()
    finally:
        db_session.close()

if __name__ == "__main__":
    main()
