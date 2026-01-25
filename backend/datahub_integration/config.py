"""
Configuration for DataHub integration.
"""

import os
from typing import Optional


class DataHubConfig:
    """Configuration for DataHub connection and metadata"""
    
    # DataHub server settings
    GMS_SERVER: str = os.getenv("DATAHUB_GMS_URL", "http://localhost:8080")
    GMS_TOKEN: Optional[str] = os.getenv("DATAHUB_GMS_TOKEN")
    
    # Platform settings
    PLATFORM_NAME: str = "oversight"
    PLATFORM_DISPLAY_NAME: str = "OverSight"
    PLATFORM_TYPE: str = "others"
    
    # Environment
    ENVIRONMENT: str = os.getenv("DATAHUB_ENV", "PROD")
    
    # API settings
    OVERSIGHT_API_URL: str = os.getenv("OVERSIGHT_API_URL", "http://localhost:8000")
    
    # Timeout and retry settings
    CONNECTION_TIMEOUT: int = 30  # seconds
    MAX_RETRIES: int = 3
    RETRY_BACKOFF: float = 2.0  # exponential backoff multiplier
    
    # Batch settings
    BATCH_SIZE: int = 50
    
    # Enrichment version
    ENRICHMENT_VERSION: str = "v1.0"
    
    # Confidence threshold for low confidence warning
    LOW_CONFIDENCE_THRESHOLD: float = 0.7
    
    @classmethod
    def get_dataset_urn(cls, source_system: str) -> str:
        """
        Generate DataHub URN for a dataset.
        
        Args:
            source_system: Source system identifier (e.g., "sqlite_products")
            
        Returns:
            DataHub URN string
        """
        # Sanitize source_system for URN (remove file extensions)
        dataset_name = source_system.replace('.db', '').replace('.json', '').replace('.csv', '')
        return f"urn:li:dataset:(urn:li:dataPlatform:{cls.PLATFORM_NAME},{dataset_name},{cls.ENVIRONMENT})"
    
    @classmethod
    def get_tag_urn(cls, tag_name: str) -> str:
        """
        Generate DataHub URN for a tag.
        
        Args:
            tag_name: Tag name
            
        Returns:
            DataHub tag URN
        """
        return f"urn:li:tag:{tag_name}"
    
    @classmethod
    def get_domain_urn(cls, domain_name: str) -> str:
        """
        Generate DataHub URN for a domain.
        
        Args:
            domain_name: Domain name
            
        Returns:
            DataHub domain URN
        """
        return f"urn:li:domain:{domain_name.lower()}"
