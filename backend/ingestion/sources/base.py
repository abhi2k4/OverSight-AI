from abc import ABC, abstractmethod
from typing import List, Dict, Any

class DataSource(ABC):
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
