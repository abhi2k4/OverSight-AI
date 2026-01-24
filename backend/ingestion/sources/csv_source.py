import csv
import os
from typing import List, Dict, Any
from .base import DataSource

class CsvSource(DataSource):
    def connect(self):
        self.file_path = self.config.get("file_path")
        if not self.file_path or not os.path.exists(self.file_path):
            raise FileNotFoundError(f"CSV file not found at: {self.file_path}")
        print(f"Ready to read CSV from {self.file_path}")

    def get_source_name(self) -> str:
        return f"csv_{os.path.basename(self.config.get('file_path', 'unknown'))}"

    def fetch_data(self) -> List[Dict[str, Any]]:
        return list(self.iter_data())

    def iter_data(self):
        with open(self.file_path, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                yield row
