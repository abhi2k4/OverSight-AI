"""
Manual sync script to push enriched data to DataHub.
"""

import sys
import os

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from backend.database import SessionLocal
from backend.datahub_integration.sync_service import DataHubSyncService
from backend.datahub_integration.config import DataHubConfig


def main():
    """Sync all enriched data to DataHub"""
    print("=" * 70)
    print("DataHub Sync - OverSight Enriched Data")
    print("=" * 70)
    print()
    
    config = DataHubConfig()
    print(f"DataHub GMS Server: {config.GMS_SERVER}")
    print(f"OverSight API: {config.OVERSIGHT_API_URL}")
    print()
    
    # Create database session
    db = SessionLocal()
    
    try:
        # Initialize sync service
        sync_service = DataHubSyncService(db, config)
        
        # Test connection
        print("Testing DataHub connection...")
        if not sync_service.test_connection():
            print("❌ Failed to connect to DataHub GMS")
            print(f"   Make sure DataHub is running at {config.GMS_SERVER}")
            return
        print("✅ Connected to DataHub GMS")
        print()
        
        # Get sync stats
        print("Analyzing data to sync...")
        stats = sync_service.get_sync_stats()
        print(f"Total records: {stats['total_records']}")
        print(f"Total sources: {stats['total_sources']}")
        print()
        
        if stats['total_records'] == 0:
            print("⚠️  No enriched records found to sync")
            print("   Run ingestion and enrichment first:")
            print("   python run_ingestion_with_enrichment.py")
            return
        
        # Display sources
        print("Sources to sync:")
        for source, count in stats['sources'].items():
            print(f"  - {source}: {count} records")
        print()
        
        # Perform sync
        print("Starting sync...")
        print("-" * 70)
        results = sync_service.sync_all()
        print()
        
        # Display results
        print("=" * 70)
        print("Sync Complete")
        print("=" * 70)
        print(f"Status: {results['status'].upper()}")
        print(f"Sources synced: {results['synced_sources']}/{stats['total_sources']}")
        print(f"Total records: {results['total_records']}")
        print()
        
        # Show per-source results
        if results['sources']:
            print("Per-source results:")
            for source, source_result in results['sources'].items():
                status = "✅" if source_result['success'] else "❌"
                print(f"  {status} {source}: {source_result['mcps_emitted']}/{source_result['mcps_created']} MCPs emitted")
        
        # Show errors
        if results['errors']:
            print()
            print("Errors:")
            for error in results['errors']:
                print(f"  ❌ {error}")
        
        print()
        print("Next steps:")
        print("  1. Open DataHub UI: http://localhost:9002")
        print("  2. Browse to Platform: 'oversight'")
        print("  3. View synced datasets")
        print()
        
    except Exception as e:
        print(f"❌ Error during sync: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()


if __name__ == "__main__":
    main()
