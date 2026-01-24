from typing import List, Dict, Any
from .base import DataSource

class SalesSource(DataSource):
    def connect(self):
        # In a real scenario, this would connect to MongoDB/DynamoDB
        print("Connected to NoSQL Sales Database (Simulated)")

    def get_source_name(self) -> str:
        return "sales_nosql_db"

    def fetch_data(self) -> List[Dict[str, Any]]:
        # Simulating NoSQL documents (nested)
        return [
            {
                "transaction_id": "tx_9001",
                "customer": "TechCorp",
                "items": [{"product_id": 101, "qty": 2}],
                "total": 1998.00,
                "metadata": {"region": "US-East", "channel": "Direct"}
            },
            {
                "transaction_id": "tx_9002",
                "customer": "InnovateInc",
                "items": [{"product_id": 102, "qty": 1}, {"product_id": 103, "qty": 5}],
                "total": 5495.00,
                "metadata": {"region": "EU-West", "channel": "Partner"}
            },
        ]
