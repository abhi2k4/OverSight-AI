import hashlib
import json
from datetime import datetime, timezone
from typing import Any, Dict, Iterable


def infer_value_type(value: Any) -> str:
    if value is None:
        return "null"
    if isinstance(value, bool):
        return "bool"
    if isinstance(value, int) and not isinstance(value, bool):
        return "int"
    if isinstance(value, float):
        return "float"
    if isinstance(value, str):
        return "string"
    if isinstance(value, list):
        return "array"
    if isinstance(value, dict):
        return "object"
    return "string"


def _merge_types(types: Iterable[str]) -> str:
    type_set = set(types)
    type_set.discard("null")
    if not type_set:
        return "null"
    if type_set.issubset({"int", "float"}):
        return "number"
    if len(type_set) == 1:
        return next(iter(type_set))
    return "mixed"


def infer_schema(records: Iterable[Dict[str, Any]]) -> Dict[str, Any]:
    field_types: Dict[str, set] = {}
    field_presence: Dict[str, int] = {}
    total_records = 0

    for record in records:
        total_records += 1
        for key, value in record.items():
            field_types.setdefault(key, set()).add(infer_value_type(value))
            field_presence[key] = field_presence.get(key, 0) + 1

    fields: Dict[str, Dict[str, Any]] = {}
    for field, types in field_types.items():
        merged_type = _merge_types(types)
        present_count = field_presence.get(field, 0)
        fields[field] = {
            "type": merged_type,
            "nullable": present_count < total_records or "null" in types,
            "present": present_count,
        }

    return {
        "record_count": total_records,
        "fields": fields,
        "inferred_at": datetime.now(timezone.utc).isoformat(),
    }


def schema_version(schema: Dict[str, Any]) -> str:
    payload = json.dumps(schema.get("fields", {}), sort_keys=True, ensure_ascii=True)
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()[:12]
