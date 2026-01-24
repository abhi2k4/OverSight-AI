"""Configuration for ingestion pipeline"""

from typing import Optional


class IngestionConfig:
    """Configuration for the ingestion pipeline"""
    
    def __init__(
        self,
        output_dir: str = "output",
        sample_size: int = 100,
        flatten: bool = True,
        preserve_raw: bool = True,
        auto_enrich: bool = False,
        write_to_db: bool = False,
        enrichment_batch_size: int = 10
    ):
        """
        Initialize ingestion configuration
        
        Args:
            output_dir: Directory for JSONL output files
            sample_size: Number of records to sample for schema inference
            flatten: Whether to flatten nested structures
            preserve_raw: Whether to preserve raw records in output
            auto_enrich: Whether to automatically enrich ingested data
            write_to_db: Whether to write ingested data directly to database
            enrichment_batch_size: Batch size for enrichment processing
        """
        self.output_dir = output_dir
        self.sample_size = sample_size
        self.flatten = flatten
        self.preserve_raw = preserve_raw
        self.auto_enrich = auto_enrich
        self.write_to_db = write_to_db
        self.enrichment_batch_size = enrichment_batch_size


# Default configuration
DEFAULT_CONFIG = IngestionConfig()
