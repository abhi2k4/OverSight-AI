from sqlalchemy import Column, Integer, String, JSON, DateTime, Index
from sqlalchemy.sql import func
from backend.database import Base

class UnifiedRecord(Base):
    __tablename__ = "unified_records"

    id = Column(Integer, primary_key=True, index=True)
    source_system = Column(String, index=True)  # e.g., 'product_db', 'sales_nosql', 'users_csv'
    entity_type = Column(String, index=True)    # e.g., 'product', 'transaction', 'user'
    raw_data = Column(JSON)                     # Stores the flexible payload
    
    ingestion_timestamp = Column(DateTime(timezone=True), server_default=func.now())
    
    # Placeholder for future governance fields
    # risk_score = Column(Float, nullable=True)
    # compliance_status = Column(String, nullable=True)


class EnrichedRecord(Base):
    """Model for storing enriched records with AI-generated metadata"""
    __tablename__ = "enriched_records"

    id = Column(Integer, primary_key=True, index=True)
    
    # Source metadata
    source_system = Column(String(100), nullable=False, index=True)
    entity_type = Column(String(100), nullable=False, index=True)
    
    # Data
    raw_data = Column(JSON, nullable=False)
    enriched_metadata = Column(JSON, nullable=False)  # {description, tags, confidence, entities}
    
    # Timestamps
    ingestion_timestamp = Column(DateTime(timezone=True), server_default=func.now())
    enrichment_timestamp = Column(DateTime(timezone=True), server_default=func.now())
    
    # Versioning
    enrichment_version = Column(String(50))
    
    # Add index for common queries
    __table_args__ = (
        Index('idx_enrichment_ts', 'enrichment_timestamp'),
    )
