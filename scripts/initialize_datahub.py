"""
One-time initialization script for DataHub.
Creates tags and domains in DataHub for OverSight taxonomy.
"""

import sys
import os

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from backend.datahub.tag_initializer import TagInitializer
from backend.datahub.domain_initializer import DomainInitializer
from backend.datahub.config import DataHubConfig


def main():
    """Initialize DataHub with tags and domains"""
    print("=" * 70)
    print("DataHub Initialization - OverSight")
    print("=" * 70)
    print()
    
    config = DataHubConfig()
    print(f"DataHub GMS Server: {config.GMS_SERVER}")
    print()
    
    # Initialize tags
    print("Step 1: Creating Tags")
    print("-" * 70)
    tag_init = TagInitializer(config)
    
    try:
        tag_results = tag_init.initialize_all_tags()
        print(f"✅ Tags created: {tag_results['tags_created']}")
        if tag_results['tags_failed'] > 0:
            print(f"❌ Tags failed: {tag_results['tags_failed']}")
            for error in tag_results.get('errors', []):
                print(f"   - {error}")
        print()
    except Exception as e:
        print(f"❌ Error creating tags: {e}")
        print()
    finally:
        tag_init.close()
    
    # Initialize domains
    print("Step 2: Creating Domains")
    print("-" * 70)
    domain_init = DomainInitializer(config)
    
    try:
        domain_results = domain_init.initialize_all_domains()
        print(f"✅ Domains created: {domain_results['domains_created']}")
        if domain_results['domains_failed'] > 0:
            print(f"❌ Domains failed: {domain_results['domains_failed']}")
            for error in domain_results.get('errors', []):
                print(f"   - {error}")
        print()
    except Exception as e:
        print(f"❌ Error creating domains: {e}")
        print()
    finally:
        domain_init.close()
    
    # Summary
    print("=" * 70)
    print("Initialization Complete")
    print("=" * 70)
    print()
    print("Next steps:")
    print("  1. Verify tags and domains in DataHub UI: http://localhost:9002")
    print("  2. Run data sync: python scripts/sync_to_datahub.py")
    print()


if __name__ == "__main__":
    main()
