import sqlite3
import os
from typing import List, Dict, Any
from .base import DataSource

class SqliteSource(DataSource):
    def connect(self):
        db_path = self.config.get("file_path")
        if not db_path or not os.path.exists(db_path):
            raise FileNotFoundError(f"SQLite DB not found at: {db_path}")
        self.conn = sqlite3.connect(db_path)
        print(f"Connected to SQLite DB at {db_path}")

    def get_source_name(self) -> str:
        return f"sqlite_{os.path.basename(self.config.get('file_path', 'unknown'))}"

    def fetch_data(self) -> List[Dict[str, Any]]:
        cursor = self.conn.cursor()
        # In a real generic app, table name should be in config.
        # For this demo, we'll try to guess or use a config 'table' if present, else default.
        table_name = self.config.get("table", "products") 
        try:
            cursor.execute(f"SELECT * FROM {table_name}")
            columns = [col[0] for col in cursor.description]
            rows = cursor.fetchall()
            return [dict(zip(columns, row)) for row in rows]
        except sqlite3.OperationalError:
            print(f"Table '{table_name}' not found. Returning empty list.")
            return []
