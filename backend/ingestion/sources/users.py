from typing import List, Dict, Any
from .base import DataSource
import csv
import io

class UserSource(DataSource):
    def connect(self):
        # Setup for reading file path or stream
        print("Ready to read User CSV (Simulated)")

    def get_source_name(self) -> str:
        return "users_csv_file"

    def fetch_data(self) -> List[Dict[str, Any]]:
        # Simulating reading from a CSV file
        csv_content = """user_id,email,role,status
u_001,admin@oversight.ai,admin,active
u_002,analyst@client.com,viewer,active
u_003,bot@automated.net,service_account,inactive
"""
        reader = csv.DictReader(io.StringIO(csv_content))
        return [row for row in reader]
