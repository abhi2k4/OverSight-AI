"""
Tag initializer for creating DataHub tags from OverSight taxonomy.
"""

import logging
from typing import Dict, List, Optional

from datahub.emitter.mcp import MetadataChangeProposalWrapper
from datahub.metadata.schema_classes import TagPropertiesClass

from .config import DataHubConfig
from .emitter import DataHubEmitter

logger = logging.getLogger(__name__)


# OverSight taxonomy with descriptions and colors
OVERSIGHT_TAGS = {
    # Business tags
    "product": {
        "description": "Product catalog and inventory data",
        "color": "#2196F3"  # Blue
    },
    "sales": {
        "description": "Sales transactions and revenue data",
        "color": "#4CAF50"  # Green
    },
    "hr": {
        "description": "Human resources and employee data",
        "color": "#9C27B0"  # Purple
    },
    "finance": {
        "description": "Financial records and accounting data",
        "color": "#FF9800"  # Orange
    },
    "marketing": {
        "description": "Marketing campaigns and analytics",
        "color": "#E91E63"  # Pink
    },
    "operations": {
        "description": "Operational metrics and logs",
        "color": "#607D8B"  # Blue Grey
    },
    
    # Data type tags
    "customer_data": {
        "description": "Customer information and profiles",
        "color": "#00BCD4"  # Cyan
    },
    "transaction": {
        "description": "Transaction records and payment data",
        "color": "#8BC34A"  # Light Green
    },
    "analytics": {
        "description": "Analytics and business intelligence data",
        "color": "#3F51B5"  # Indigo
    },
    "logs": {
        "description": "System and application logs",
        "color": "#795548"  # Brown
    },
    
    # Sensitivity tags
    "pii": {
        "description": "Personally Identifiable Information - requires special handling",
        "color": "#F44336"  # Red
    },
    "sensitive": {
        "description": "Sensitive business data with restricted access",
        "color": "#FF5722"  # Deep Orange
    },
    "public": {
        "description": "Public data suitable for general access",
        "color": "#4CAF50"  # Green
    },
    
    # Structure tags
    "structured": {
        "description": "Structured data with defined schema",
        "color": "#009688"  # Teal
    },
    "unstructured": {
        "description": "Unstructured data without fixed schema",
        "color": "#9E9E9E"  # Grey
    },
    "media": {
        "description": "Media files and binary data",
        "color": "#673AB7"  # Deep Purple
    },
}


class TagInitializer:
    """
    Initializes DataHub tags from OverSight taxonomy.
    """
    
    def __init__(self, config: Optional[DataHubConfig] = None):
        """
        Initialize tag initializer.
        
        Args:
            config: DataHub configuration
        """
        self.config = config or DataHubConfig()
        self.emitter = DataHubEmitter(self.config)
    
    def create_tag(self, tag_name: str, tag_info: Dict[str, str]) -> MetadataChangeProposalWrapper:
        """
        Create a MetadataChangeProposal for a tag.
        
        Args:
            tag_name: Tag name
            tag_info: Dictionary with description and color
            
        Returns:
            MetadataChangeProposal for the tag
        """
        tag_urn = self.config.get_tag_urn(tag_name)
        
        tag_properties = TagPropertiesClass(
            name=tag_name,
            description=tag_info["description"],
            colorHex=tag_info.get("color", "#808080"),
        )
        
        return MetadataChangeProposalWrapper(
            entityUrn=tag_urn,
            aspect=tag_properties,
        )
    
    def initialize_all_tags(self) -> Dict[str, any]:
        """
        Create all tags in DataHub.
        
        Returns:
            Dictionary with results
        """
        logger.info(f"Initializing {len(OVERSIGHT_TAGS)} tags in DataHub")
        
        mcps = []
        for tag_name, tag_info in OVERSIGHT_TAGS.items():
            mcp = self.create_tag(tag_name, tag_info)
            mcps.append(mcp)
        
        # Emit all tags
        results = self.emitter.emit_batch(mcps)
        
        logger.info(f"Tag initialization complete: {results['success']} created, {results['failed']} failed")
        
        return {
            "tags_created": results["success"],
            "tags_failed": results["failed"],
            "errors": results.get("errors", [])
        }
    
    def get_tag_list(self) -> List[str]:
        """Get list of all tag names"""
        return list(OVERSIGHT_TAGS.keys())
    
    def close(self):
        """Close connections"""
        self.emitter.close()
