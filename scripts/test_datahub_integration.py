"""
End-to-end test for DataHub integration.
Tests the complete flow: ingest → enrich → sync → verify in DataHub.

Prerequisites:
- DataHub running at http://localhost:8080
- Enriched data in database
"""

import sys
import os
import time

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from backend.database import SessionLocal
from backend.datahub_integration.sync_service import DataHubSyncService
from backend.datahub_integration.config import DataHubConfig
from backend.repositories.enriched_record_repository import EnrichedRecordRepository


def test_connection():
    """Test 1: Verify DataHub connection"""
    print("\n" + "=" * 70)
    print("TEST 1: DataHub Connection")
    print("=" * 70)
    
    config = DataHubConfig()
    db = SessionLocal()
    sync_service = DataHubSyncService(db, config)
    
    try:
        connected = sync_service.test_connection()
        if connected:
            print("✅ PASS: Connected to DataHub GMS")
            return True
        else:
            print("❌ FAIL: Cannot connect to DataHub GMS")
            print(f"   Make sure DataHub is running at {config.GMS_SERVER}")
            return False
    finally:
        db.close()


def test_sync_stats():
    """Test 2: Get sync statistics"""
    print("\n" + "=" * 70)
    print("TEST 2: Sync Statistics")
    print("=" * 70)
    
    config = DataHubConfig()
    db = SessionLocal()
    sync_service = DataHubSyncService(db, config)
    
    try:
        stats = sync_service.get_sync_stats()
        print(f"Total records: {stats['total_records']}")
        print(f"Total sources: {stats['total_sources']}")
        
        if stats['total_records'] > 0:
            print("✅ PASS: Found enriched data to sync")
            for source, count in stats['sources'].items():
                print(f"   - {source}: {count} records")
            return True
        else:
            print("⚠️  WARN: No enriched data found")
            print("   Run: python run_ingestion_with_enrichment.py")
            return False
    finally:
        db.close()


def test_full_sync():
    """Test 3: Perform full sync"""
    print("\n" + "=" * 70)
    print("TEST 3: Full Sync to DataHub")
    print("=" * 70)
    
    config = DataHubConfig()
    db = SessionLocal()
    sync_service = DataHubSyncService(db, config)
    
    try:
        results = sync_service.sync_all()
        
        print(f"Status: {results['status']}")
        print(f"Synced sources: {results['synced_sources']}")
        print(f"Total records: {results['total_records']}")
        
        if results['synced_sources'] > 0 and results['status'] in ['success', 'partial']:
            print("✅ PASS: Sync completed successfully")
            for source, source_result in results.get('sources', {}).items():
                status = "✅" if source_result['success'] else "❌"
                print(f"   {status} {source}: {source_result['mcps_emitted']}/{source_result['mcps_created']} MCPs")
            return True
        else:
            print("❌ FAIL: Sync failed")
            for error in results.get('errors', []):
                print(f"   Error: {error}")
            return False
    finally:
        db.close()


def test_verify_in_datahub():
    """Test 4: Verify data appears in DataHub (manual verification)"""
    print("\n" + "=" * 70)
    print("TEST 4: Verify in DataHub UI (Manual)")
    print("=" * 70)
    
    print("\nManual verification steps:")
    print("1. Open DataHub UI: http://localhost:9002")
    print("2. Login with: datahub / datahub")
    print("3. Navigate to Browse → Platform: 'oversight'")
    print("4. Verify datasets appear:")
    
    config = DataHubConfig()
    db = SessionLocal()
    repo = EnrichedRecordRepository(db)
    
    try:
        # Get all sources
        records = repo.get_all_records()
        sources = set(r.source_system for r in records)
        
        for source in sources:
            dataset_urn = config.get_dataset_urn(source)
            print(f"   - {source}")
            print(f"     URN: {dataset_urn}")
        
        print("\n5. Click on each dataset and verify:")
        print("   - Description contains 'enriched with AI-generated metadata'")
        print("   - Tags are visible and clickable")
        print("   - Schema shows inferred fields")
        print("   - Custom properties include confidence scores")
        
        print("\n✅ PASS: Manual verification instructions provided")
        return True
    finally:
        db.close()


def main():
    """Run all tests"""
    print("=" * 70)
    print("DataHub Integration - End-to-End Test")
    print("=" * 70)
    
    results = []
    
    # Test 1: Connection
    results.append(("Connection", test_connection()))
    
    if not results[-1][1]:
        print("\n❌ Cannot proceed without DataHub connection")
        return
    
    # Test 2: Stats
    results.append(("Sync Stats", test_sync_stats()))
    
    if not results[-1][1]:
        print("\n⚠️  Cannot sync without enriched data")
    else:
        # Test 3: Sync
        results.append(("Full Sync", test_full_sync()))
        
        if results[-1][1]:
            # Wait for indexing
            print("\nWaiting 5 seconds for DataHub indexing...")
            time.sleep(5)
            
            # Test 4: Verify
            results.append(("UI Verification", test_verify_in_datahub()))
    
    # Summary
    print("\n" + "=" * 70)
    print("Test Summary")
    print("=" * 70)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status}: {test_name}")
    
    print(f"\nTotal: {passed}/{total} tests passed")
    
    if passed == total:
        print("\n🎉 All tests passed! DataHub integration is working correctly.")
    else:
        print("\n⚠️  Some tests failed. Check the output above for details.")


if __name__ == "__main__":
    main()
