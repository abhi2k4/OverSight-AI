import json
import os
from typing import List, Dict, Any
from .base import DataSource

class JsonSource(DataSource):
    def connect(self):
        self.file_path = self.config.get("file_path")
        if not self.file_path or not os.path.exists(self.file_path):
            raise FileNotFoundError(f"JSON file not found at: {self.file_path}")
        print(f"Ready to read JSON from {self.file_path}")

    def get_source_name(self) -> str:
        return f"json_{os.path.basename(self.config.get('file_path', 'unknown'))}"

    def fetch_data(self) -> List[Dict[str, Any]]:
        return list(self.iter_data())

    def iter_data(self):
        with open(self.file_path, "r", encoding="utf-8") as f:
            data = json.load(f)
            if isinstance(data, list):
                for item in data:
                    yield item
            elif isinstance(data, dict):
                yield data
