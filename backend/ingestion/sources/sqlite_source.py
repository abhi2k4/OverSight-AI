import sqlite3
import os
from typing import List, Dict, Any
from .base import DataSource

class SqliteSource(DataSource):
    def connect(self):
        self.file_path = self.config.get("file_path")
        if not self.file_path or not os.path.exists(self.file_path):
            raise FileNotFoundError(f"SQLite DB not found at: {self.file_path}")
        self.conn = sqlite3.connect(self.file_path)
        print(f"Connected to SQLite DB at {self.file_path}")

    def disconnect(self):
        if getattr(self, "conn", None):
            self.conn.close()

    def get_source_name(self) -> str:
        return f"sqlite_{os.path.basename(self.config.get('file_path', 'unknown'))}"

    def fetch_data(self) -> List[Dict[str, Any]]:
        records: List[Dict[str, Any]] = []
        for item in self.iter_data():
            if isinstance(item, tuple) and len(item) == 2:
                records.append(item[1])
            else:
                records.append(item)
        return records

    def iter_data(self):
        cursor = self.conn.cursor()
        query = self.config.get("query")
        if query:
            entity = self.config.get("entity_type", "generic")
            yield from self._iter_query(cursor, query, entity)
            return

        tables = self.config.get("tables")
        if isinstance(tables, str):
            tables = [tables]

        if not tables:
            table = self.config.get("table")
            tables = [table] if table else self._list_tables(cursor)

        for table_name in tables:
            yield from self._iter_table(cursor, table_name)

    def _list_tables(self, cursor) -> List[str]:
        cursor.execute(
            "SELECT name FROM sqlite_master "
            "WHERE type='table' AND name NOT LIKE 'sqlite_%'"
        )
        return [row[0] for row in cursor.fetchall()]

    def _iter_query(self, cursor, query: str, entity: str):
        try:
            cursor.execute(query)
        except sqlite3.OperationalError as error:
            print(f"Query failed: {error}")
            return
        columns = [col[0] for col in cursor.description] if cursor.description else []
        for row in cursor:
            record = dict(zip(columns, row)) if columns else {}
            yield (entity, record)

    def _iter_table(self, cursor, table_name: str):
        try:
            cursor.execute(f"SELECT * FROM {table_name}")
        except sqlite3.OperationalError:
            print(f"Table '{table_name}' not found. Skipping.")
            return
        columns = [col[0] for col in cursor.description] if cursor.description else []
        for row in cursor:
            yield (table_name, dict(zip(columns, row)))
