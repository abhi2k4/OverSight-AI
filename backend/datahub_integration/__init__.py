"""
DataHub integration package for OverSight.
Syncs enriched metadata to DataHub for discovery and governance.
"""

from .config import DataHubConfig
from .emitter import DataHubEmitter
from .sync_service import DataHubSyncService

__all__ = [
    "DataHubConfig",
    "DataHubEmitter",
    "DataHubSyncService",
]
