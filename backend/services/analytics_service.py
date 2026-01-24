"""
Service for calculating enrichment analytics and statistics.
"""

from typing import Dict, List
from datetime import datetime, timezone, timedelta

from backend.api.helpers import parse_metadata_json
from backend.api.constants import (
    NORMAL_CONFIDENCE_DEFAULT,
    LOW_CONFIDENCE_THRESHOLD,
    RECENT_ENRICHMENT_HOURS
)
from backend.api.schemas import EnrichmentStats
from backend.models import EnrichedRecord


class AnalyticsService:
    """
    Service for calculating enrichment statistics and analytics.
    """
    
    def calculate_enrichment_stats(self, records: List[EnrichedRecord]) -> EnrichmentStats:
        """
        Calculate comprehensive enrichment statistics from records.
        
        Args:
            records: List of enriched records to analyze
            
        Returns:
            EnrichmentStats with aggregated metrics
        """
        if not records:
            return EnrichmentStats(
                total_records=0,
                total_enriched=0,
                avg_confidence=0.0,
                enrichments_by_source={},
                enrichments_by_entity={},
                enrichments_by_tag={},
                recent_enrichments=0,
                low_confidence_count=0
            )
        
        confidences = []
        sources: Dict[str, int] = {}
        entities: Dict[str, int] = {}
        tags: Dict[str, int] = {}
        recent_count = 0
        low_confidence_count = 0
        
        recent_threshold = datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(hours=RECENT_ENRICHMENT_HOURS)
        
        for record in records:
            metadata = parse_metadata_json(record.enriched_metadata)
            confidence = metadata.get("confidence", NORMAL_CONFIDENCE_DEFAULT)
            confidences.append(confidence)
            
            if confidence < LOW_CONFIDENCE_THRESHOLD:
                low_confidence_count += 1
            
            sources[record.source_system] = sources.get(record.source_system, 0) + 1
            entities[record.entity_type] = entities.get(record.entity_type, 0) + 1
            
            for tag in metadata.get("tags", []):
                tags[tag] = tags.get(tag, 0) + 1
            
            if record.enrichment_timestamp and record.enrichment_timestamp.replace(tzinfo=None) > recent_threshold:
                recent_count += 1
        
        avg_confidence = sum(confidences) / len(confidences) if confidences else 0.0
        
        return EnrichmentStats(
            total_records=len(records),
            total_enriched=len(records),
            avg_confidence=round(avg_confidence, 3),
            enrichments_by_source=sources,
            enrichments_by_entity=entities,
            enrichments_by_tag=tags,
            recent_enrichments=recent_count,
            low_confidence_count=low_confidence_count
        )
