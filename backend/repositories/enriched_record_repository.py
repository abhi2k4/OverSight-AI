"""
Repository for EnrichedRecord database operations.
"""

from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional, Dict, Any

from backend.models import EnrichedRecord


class EnrichedRecordRepository:
    """
    Repository for enriched record data access operations.
    """
    
    def __init__(self, db: Session):
        """
        Initialize repository with database session.
        
        Args:
            db: SQLAlchemy database session
        """
        self.db = db
    
    def get_all(
        self,
        limit: int,
        offset: int,
        tags: Optional[List[str]] = None,
        entity_type: Optional[str] = None,
        source_system: Optional[str] = None,
        min_confidence: Optional[float] = None,
        search: Optional[str] = None
    ) -> tuple[List[EnrichedRecord], int]:
        """
        Get enriched records with filters and pagination.
        
        Returns:
            Tuple of (records list, total count)
        """
        query = self.db.query(EnrichedRecord)
        
        if entity_type:
            query = query.filter(EnrichedRecord.entity_type == entity_type)
        
        if source_system:
            query = query.filter(EnrichedRecord.source_system == source_system)
        
        if tags:
            for tag in tags:
                query = query.filter(
                    func.json_extract(EnrichedRecord.enriched_metadata, '$.tags').like(f'%{tag}%')
                )
        
        if min_confidence is not None:
            query = query.filter(
                func.cast(
                    func.json_extract(EnrichedRecord.enriched_metadata, '$.confidence'),
                    self.db.Float
                ) >= min_confidence
            )
        
        if search:
            query = query.filter(
                func.json_extract(EnrichedRecord.enriched_metadata, '$.description').like(f'%{search}%')
            )
        
        total = query.count()
        records = query.order_by(EnrichedRecord.enrichment_timestamp.desc()).offset(offset).limit(limit).all()
        
        return records, total
    
    def get_by_confidence_range(
        self,
        min_confidence: float,
        max_confidence: float,
        limit: int
    ) -> List[EnrichedRecord]:
        """Get records within a confidence range."""
        query = self.db.query(EnrichedRecord).filter(
            func.cast(
                func.json_extract(EnrichedRecord.enriched_metadata, '$.confidence'),
                self.db.Float
            ).between(min_confidence, max_confidence)
        ).limit(limit)
        
        return query.all()
    
    def create(self, record: EnrichedRecord) -> EnrichedRecord:
        """Create a new enriched record."""
        self.db.add(record)
        self.db.commit()
        self.db.refresh(record)
        return record
    
    def count_all(self) -> int:
        """Get total count of enriched records."""
        return self.db.query(EnrichedRecord).count()
    
    def get_all_records(self) -> List[EnrichedRecord]:
        """Get all enriched records (for analytics)."""
        return self.db.query(EnrichedRecord).all()
