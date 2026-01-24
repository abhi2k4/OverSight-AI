"""
Pytest configuration and shared fixtures.
"""

import pytest
import sys
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from backend.database import Base
from backend.models import EnrichedRecord


@pytest.fixture(scope="session")
def test_database():
    """Create a test database."""
    engine = create_engine("sqlite:///./test_oversight.db")
    Base.metadata.create_all(bind=engine)
    yield engine
    Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def db_session(test_database):
    """Create a new database session for each test."""
    TestSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_database)
    session = TestSessionLocal()
    yield session
    session.close()
