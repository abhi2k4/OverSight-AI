from typing import List, Dict, Any
from .base import DataSource

class ProductSource(DataSource):
    def connect(self):
        # In a real scenario, this would connect to PostgreSQL/MySQL
        print("Connected to SQL Product Database (Simulated)")

    def get_source_name(self) -> str:
        return "product_sql_db"

    def fetch_data(self) -> List[Dict[str, Any]]:
        # Simulating SQL rows
        return [
            {"id": 101, "name": "AI Model X", "category": "Software", "price": 999.00},
            {"id": 102, "name": "Server Rack Y", "category": "Hardware", "price": 4500.00},
            {"id": 103, "name": "Data Connector Z", "category": "Plugin", "price": 199.00},
        ]
