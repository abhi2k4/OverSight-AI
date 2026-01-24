"""
Helper functions for the enrichment API.
"""

import json
from typing import Any, Dict
from datetime import datetime

from backend.models import EnrichedRecord
from backend.api.schemas import EnrichedRecord as EnrichedRecordSchema


def parse_metadata_json(metadata: Any) -> Dict[str, Any]:
    """
    Parse metadata, handling both dict and JSON string formats.
    
    Args:
        metadata: Metadata in dict or JSON string format
        
    Returns:
        Dict containing parsed metadata
    """
    if isinstance(metadata, str):
        return json.loads(metadata)
    return metadata


def build_enriched_record_response(record: EnrichedRecord) -> EnrichedRecordSchema:
    """
    Convert database model to API response schema.
    
    Args:
        record: EnrichedRecord database model
        
    Returns:
        EnrichedRecordSchema response model
    """
    return EnrichedRecordSchema(
        id=record.id,
        source_system=record.source_system,
        entity_type=record.entity_type,
        raw_data=record.raw_data,
        enriched_metadata=parse_metadata_json(record.enriched_metadata),
        ingestion_timestamp=record.ingestion_timestamp,
        enrichment_timestamp=record.enrichment_timestamp,
        enrichment_version=record.enrichment_version
    )
