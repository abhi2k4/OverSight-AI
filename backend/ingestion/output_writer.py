import json
import os
from dataclasses import dataclass
from typing import Any, Dict


@dataclass
class JsonlPartitionWriter:
    partition_dir: str
    data_path: str
    schema_path: str
    _data_file: Any
    _schema_written: bool = False

    def write_record(self, record: Dict[str, Any]) -> None:
        json.dump(record, self._data_file, ensure_ascii=True)
        self._data_file.write("\n")

    def write_schema(self, schema: Dict[str, Any]) -> None:
        if self._schema_written:
            return
        with open(self.schema_path, "w", encoding="utf-8") as schema_file:
            json.dump(schema, schema_file, ensure_ascii=True, indent=2)
        self._schema_written = True

    def close(self) -> None:
        if self._data_file:
            self._data_file.close()


class JsonlWriter:
    def __init__(self, output_dir: str = "output"):
        self.output_dir = output_dir

    def open_partition(self, source_name: str, entity_type: str, date_key: str) -> JsonlPartitionWriter:
        partition_dir = os.path.join(self.output_dir, source_name, entity_type, date_key)
        os.makedirs(partition_dir, exist_ok=True)
        data_path = os.path.join(partition_dir, "data.jsonl")
        schema_path = os.path.join(partition_dir, "schema.json")
        data_file = open(data_path, "a", encoding="utf-8")
        return JsonlPartitionWriter(
            partition_dir=partition_dir,
            data_path=data_path,
            schema_path=schema_path,
            _data_file=data_file,
        )
