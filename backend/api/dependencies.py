"""
Dependency injection factories for FastAPI.
"""

from sqlalchemy.orm import Session

from backend.database import get_db
from backend.repositories.enriched_record_repository import EnrichedRecordRepository
from backend.services.analytics_service import AnalyticsService
from backend.services.enrichment_orchestrator import EnrichmentOrchestrator
from backend.api.enrichment_service import EnrichmentService


# Singleton instances
_enrichment_service = None


def get_enrichment_service() -> EnrichmentService:
    """Get or create enrichment service singleton."""
    global _enrichment_service
    if _enrichment_service is None:
        _enrichment_service = EnrichmentService()
    return _enrichment_service


def get_enriched_record_repository(db: Session = None) -> EnrichedRecordRepository:
    """
    Get enriched record repository.
    
    Args:
        db: Database session (injected by FastAPI)
        
    Returns:
        EnrichedRecordRepository instance
    """
    return EnrichedRecordRepository(db)


def get_analytics_service(db: Session = None) -> AnalyticsService:
    """Get analytics service."""
    return AnalyticsService()


def get_enrichment_orchestrator(db: Session = None) -> EnrichmentOrchestrator:
    """
    Get enrichment orchestrator.
    
    Args:
        db: Database session (injected by FastAPI)
        
    Returns:
        EnrichmentOrchestrator instance
    """
    enrichment_service = get_enrichment_service()
    repository = get_enriched_record_repository(db)
    return EnrichmentOrchestrator(enrichment_service, repository)
