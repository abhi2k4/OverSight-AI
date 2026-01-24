"""
Domain initializer for creating DataHub domains for data organization.
"""

import logging
from typing import Dict, List, Optional

from datahub.emitter.mcp import MetadataChangeProposalWrapper
from datahub.metadata.schema_classes import DomainPropertiesClass

from .config import DataHubConfig
from .emitter import DataHubEmitter

logger = logging.getLogger(__name__)


# OverSight domains for organizing datasets
OVERSIGHT_DOMAINS = {
    "sales": {
        "name": "Sales",
        "description": "Sales transactions, revenue data, and customer-facing data",
    },
    "hr": {
        "name": "Human Resources",
        "description": "Employee data, hiring, and HR management systems",
    },
    "finance": {
        "name": "Finance",
        "description": "Financial records, accounting data, and analytics",
    },
    "operations": {
        "name": "Operations",
        "description": "Operational metrics, logs, and system data",
    },
    "product": {
        "name": "Product",
        "description": "Product catalogs, inventory, and structured data",
    },
}


class DomainInitializer:
    """
    Initializes DataHub domains for organizing datasets.
    """
    
    def __init__(self, config: Optional[DataHubConfig] = None):
        """
        Initialize domain initializer.
        
        Args:
            config: DataHub configuration
        """
        self.config = config or DataHubConfig()
        self.emitter = DataHubEmitter(self.config)
    
    def create_domain(self, domain_id: str, domain_info: Dict[str, str]) -> MetadataChangeProposalWrapper:
        """
        Create a MetadataChangeProposal for a domain.
        
        Args:
            domain_id: Domain identifier (lowercase)
            domain_info: Dictionary with name and description
            
        Returns:
            MetadataChangeProposal for the domain
        """
        domain_urn = self.config.get_domain_urn(domain_id)
        
        domain_properties = DomainPropertiesClass(
            name=domain_info["name"],
            description=domain_info["description"],
        )
        
        return MetadataChangeProposalWrapper(
            entityUrn=domain_urn,
            aspect=domain_properties,
        )
    
    def initialize_all_domains(self) -> Dict[str, any]:
        """
        Create all domains in DataHub.
        
        Returns:
            Dictionary with results
        """
        logger.info(f"Initializing {len(OVERSIGHT_DOMAINS)} domains in DataHub")
        
        mcps = []
        for domain_id, domain_info in OVERSIGHT_DOMAINS.items():
            mcp = self.create_domain(domain_id, domain_info)
            mcps.append(mcp)
        
        # Emit all domains
        results = self.emitter.emit_batch(mcps)
        
        logger.info(f"Domain initialization complete: {results['success']} created, {results['failed']} failed")
        
        return {
            "domains_created": results["success"],
            "domains_failed": results["failed"],
            "errors": results.get("errors", [])
        }
    
    def get_domain_list(self) -> List[str]:
        """Get list of all domain IDs"""
        return list(OVERSIGHT_DOMAINS.keys())
    
    def close(self):
        """Close connections"""
        self.emitter.close()
