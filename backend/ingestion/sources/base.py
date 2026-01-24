from abc import ABC, abstractmethod
from typing import List, Dict, Any

class DataSource(ABC):
    def __init__(self, config: Dict[str, Any]):
        self.config = config

    def get_entity_type(self) -> str:
        """Return the entity type from config, default to 'generic'."""
        return self.config.get("entity_type", "generic")

    @abstractmethod
    def connect(self):
        """Establish connection to the data source."""
        pass

    def disconnect(self):
        """Close any open connections."""
        return None

    @abstractmethod
    def fetch_data(self) -> List[Dict[str, Any]]:
        """Fetch data and return as a list of dictionaries."""
        pass

    def iter_data(self):
        """Stream data records. Defaults to iterating over fetch_data()."""
        return iter(self.fetch_data())

    @abstractmethod
    def get_source_name(self) -> str:
        """Return a unique identifier for this source."""
        pass
