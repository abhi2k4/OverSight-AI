from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple

from backend.ingestion.normalization import normalize_record
from backend.ingestion.output_writer import JsonlPartitionWriter, JsonlWriter
from backend.ingestion.schema import infer_schema, schema_version
from backend.ingestion.sources.base import DataSource


class _EntityState:
    def __init__(
        self,
        source_name: str,
        entity_type: str,
        writer: JsonlWriter,
        date_key: str,
        sample_size: int,
        flatten: bool,
        preserve_raw: bool,
    ):
        self.source_name = source_name
        self.entity_type = entity_type
        self.writer = writer
        self.date_key = date_key
        self.sample_size = sample_size
        self.flatten = flatten
        self.preserve_raw = preserve_raw
        self.buffer: List[Tuple[Dict[str, Any], Dict[str, Any]]] = []
        self.key_mapping: Dict[str, str] = {}
        self.schema: Optional[Dict[str, Any]] = None
        self.schema_id: Optional[str] = None
        self.partition: Optional[JsonlPartitionWriter] = None
        self.total_records = 0

    def add_record(self, record: Any) -> None:
        normalized, mapping = normalize_record(record, flatten=self.flatten)
        for original_key, normalized_key in mapping.items():
            self.key_mapping.setdefault(original_key, normalized_key)
        self.total_records += 1

        if self.schema is None:
            self.buffer.append((record, normalized))
            if len(self.buffer) >= self.sample_size:
                self._initialize_schema()
                self._flush_buffer()
            return

        self._write_record(record, normalized)

    def finalize(self) -> int:
        if self.schema is None and self.buffer:
            self._initialize_schema()
            self._flush_buffer()
        if self.partition:
            self.partition.close()
        return self.total_records

    def _initialize_schema(self) -> None:
        sample_records = [item[1] for item in self.buffer]
        self.schema = infer_schema(sample_records)
        self.schema_id = schema_version(self.schema)
        self.partition = self.writer.open_partition(
            self.source_name,
            self.entity_type,
            self.date_key,
        )
        schema_payload = {
            "schema_version": self.schema_id,
            "source_system": self.source_name,
            "entity_type": self.entity_type,
            "key_mapping": self.key_mapping,
            "normalization": {"flatten": self.flatten},
            **self.schema,
        }
        self.partition.write_schema(schema_payload)

    def _flush_buffer(self) -> None:
        if not self.partition:
            return
        for raw_record, normalized in self.buffer:
            self._write_record(raw_record, normalized)
        self.buffer = []

    def _write_record(self, raw_record: Any, normalized: Dict[str, Any]) -> None:
        if not self.partition:
            return
        envelope = {
            "source_system": self.source_name,
            "entity_type": self.entity_type,
            "ingestion_timestamp": datetime.now(timezone.utc).isoformat(),
            "schema_version": self.schema_id,
            "record": normalized,
        }
        if self.preserve_raw:
            envelope["raw_record"] = raw_record
        self.partition.write_record(envelope)


class IngestionPipeline:
    def __init__(
        self,
        sources: List[DataSource],
        output_dir: str = "output",
        sample_size: int = 100,
        flatten: bool = True,
        preserve_raw: bool = True,
    ):
        self.sources = sources
        self.writer = JsonlWriter(output_dir)
        self.sample_size = max(1, sample_size)
        self.flatten = flatten
        self.preserve_raw = preserve_raw

    def run(self):
        print("Starting Ingestion Pipeline...")
        total_records = 0

        for source in self.sources:
            print(f"--- Processing Source: {source.get_source_name()} ---")
            try:
                source.connect()
                count = self._process_source(source)
                total_records += count
                print(f"Saved {count} records.")
            except Exception as e:
                print(f"Error processing {source.get_source_name()}: {e}")
            finally:
                source.disconnect()

        print(f"Pipeline Complete. Total records ingested: {total_records}")

    def _process_source(self, source: DataSource) -> int:
        source_name = source.get_source_name()
        date_key = datetime.now(timezone.utc).date().isoformat()
        states: Dict[str, _EntityState] = {}

        for item in source.iter_data():
            entity_type, record = self._unpack_item(item, source.get_entity_type())
            state = states.get(entity_type)
            if not state:
                state = _EntityState(
                    source_name=source_name,
                    entity_type=entity_type,
                    writer=self.writer,
                    date_key=date_key,
                    sample_size=self.sample_size,
                    flatten=self.flatten,
                    preserve_raw=self.preserve_raw,
                )
                states[entity_type] = state
            state.add_record(record)

        total_records = 0
        for state in states.values():
            total_records += state.finalize()
        return total_records

    @staticmethod
    def _unpack_item(item: Any, fallback_entity: str) -> Tuple[str, Any]:
        if isinstance(item, tuple) and len(item) == 2:
            entity_type = item[0] or fallback_entity
            return entity_type, item[1]
        return fallback_entity, item
