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

    @abstractmethod
    def fetch_data(self) -> List[Dict[str, Any]]:
        """Fetch data and return as a list of dictionaries."""
        pass

    @abstractmethod
    def get_source_name(self) -> str:
        """Return a unique identifier for this source."""
        pass
