from typing import Dict, Any, Type
from backend.ingestion.sources.base import DataSource
from backend.ingestion.sources.sqlite_source import SqliteSource
from backend.ingestion.sources.json_source import JsonSource
from backend.ingestion.sources.csv_source import CsvSource

class SourceFactory:
    _registry: Dict[str, Type[DataSource]] = {
        "sqlite": SqliteSource,
        "json": JsonSource,
        "csv": CsvSource
    }

    @classmethod
    def register(cls, source_type: str, source_cls: Type[DataSource]):
        cls._registry[source_type] = source_cls

    @classmethod
    def create(cls, source_type: str, config: Dict[str, Any]) -> DataSource:
        source_cls = cls._registry.get(source_type.lower())
        if not source_cls:
            raise ValueError(f"Unknown source type: {source_type}")
        return source_cls(config)
