from sqlalchemy import Column, Integer, String, JSON, DateTime
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
