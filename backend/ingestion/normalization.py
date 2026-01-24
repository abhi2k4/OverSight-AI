import re
from typing import Any, Dict, Tuple

_CAMEL_1_RE = re.compile(r"(.)([A-Z][a-z]+)")
_CAMEL_2_RE = re.compile(r"([a-z0-9])([A-Z])")
_NON_ALNUM_RE = re.compile(r"[^0-9a-zA-Z_]+")


def normalize_key(key: Any) -> str:
    key_str = str(key).strip()
    if not key_str:
        return "field"
    key_str = _CAMEL_1_RE.sub(r"\1_\2", key_str)
    key_str = _CAMEL_2_RE.sub(r"\1_\2", key_str)
    key_str = _NON_ALNUM_RE.sub("_", key_str)
    key_str = re.sub(r"_+", "_", key_str)
    key_str = key_str.strip("_").lower()
    return key_str or "field"


def _ensure_unique_key(key: str, used_keys: Dict[str, int]) -> str:
    if key not in used_keys:
        used_keys[key] = 0
        return key
    used_keys[key] += 1
    return f"{key}_{used_keys[key]}"


def _flatten_dict(
    data: Dict[str, Any],
    parent_path: str,
    parent_key: str,
    used_keys: Dict[str, int],
    mapping: Dict[str, str],
    output: Dict[str, Any],
) -> None:
    for key, value in data.items():
        original_path = f"{parent_path}.{key}" if parent_path else str(key)
        normalized_segment = normalize_key(key)
        normalized_key = (
            f"{parent_key}__{normalized_segment}" if parent_key else normalized_segment
        )

        if isinstance(value, dict):
            _flatten_dict(
                value,
                original_path,
                normalized_key,
                used_keys,
                mapping,
                output,
            )
            continue

        final_key = _ensure_unique_key(normalized_key, used_keys)
        output[final_key] = value
        mapping[original_path] = final_key


def normalize_record(record: Any, flatten: bool = True) -> Tuple[Dict[str, Any], Dict[str, str]]:
    if not isinstance(record, dict):
        record = {"value": record}

    mapping: Dict[str, str] = {}
    used_keys: Dict[str, int] = {}
    output: Dict[str, Any] = {}

    if flatten:
        _flatten_dict(record, "", "", used_keys, mapping, output)
        return output, mapping

    for key, value in record.items():
        normalized_key = normalize_key(key)
        final_key = _ensure_unique_key(normalized_key, used_keys)
        output[final_key] = value
        mapping[str(key)] = final_key

    return output, mapping
