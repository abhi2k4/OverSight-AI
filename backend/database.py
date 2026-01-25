from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
import os
from pathlib import Path

# Get the project root directory (parent of backend)
PROJECT_ROOT = Path(__file__).parent.parent
DB_PATH = PROJECT_ROOT / "backend" / "oversight.db"

# Use absolute path for SQLite to avoid path resolution issues
DATABASE_URL = f"sqlite:///{DB_PATH}"

engine = create_engine(
    DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    # Import all models here to ensure they are registered with Base metadata
    from backend.models import (
        UnifiedRecord, EnrichedRecord, Agent, AgentConversation,
        AgentMessage, AgentToolExecution, Policy, Compliance, Violation
    )
    Base.metadata.create_all(bind=engine)
