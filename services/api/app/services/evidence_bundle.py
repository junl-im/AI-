import hashlib
import json
from collections.abc import Mapping, Sequence
from typing import Any

EVIDENCE_BUNDLE_SCHEMA_VERSION = "2"

_BUNDLE_KEYS = {
    "schema_version",
    "app_version",
    "exported_at",
    "redacted",
    "device_benchmarks",
    "stt_regeneration_comparisons",
    "export_soak_records",
    "summary",
    "manifest",
}


def _canonical_value(value: Any) -> Any:
    if isinstance(value, Mapping):
        return {
            str(key): _canonical_value(item)
            for key, item in sorted(value.items(), key=lambda pair: str(pair[0]))
        }
    if isinstance(value, Sequence) and not isinstance(value, (str, bytes, bytearray)):
        return [_canonical_value(item) for item in value]
    return value


def canonical_json(value: Any) -> str:
    return json.dumps(
        _canonical_value(value),
        ensure_ascii=False,
        sort_keys=True,
        separators=(",", ":"),
        allow_nan=False,
    )


def sha256_json(value: Any) -> str:
    return hashlib.sha256(canonical_json(value).encode()).hexdigest()


def _record_id(category: str, index: int, payload: dict[str, object]) -> str:
    value = payload.get("id") or payload.get("run_id") or payload.get("segment_id")
    return str(value) if value else f"{category}:{index + 1}"


def normalize_categories(
    categories: Mapping[str, list[dict[str, object]]],
) -> dict[str, list[dict[str, object]]]:
    normalized_categories: dict[str, list[dict[str, object]]] = {}
    for category in sorted(categories):
        items = sorted(
            categories[category],
            key=lambda item: (
                str(item.get("recorded_at", "")),
                str(item.get("id", "")),
                sha256_json(item),
            ),
        )
        normalized_categories[category] = items
    return normalized_categories


def build_record_manifest(
    categories: Mapping[str, list[dict[str, object]]],
) -> tuple[list[dict[str, object]], dict[str, int], str]:
    records: list[dict[str, object]] = []
    normalized_categories = normalize_categories(categories)
    for category, items in normalized_categories.items():
        for index, item in enumerate(items):
            records.append({
                "category": category,
                "id": _record_id(category, index, item),
                "sha256": sha256_json({"category": category, "payload": item}),
            })
    category_counts = {
        category: len(items) for category, items in normalized_categories.items()
    }
    records_sha256 = sha256_json(normalized_categories)
    return records, category_counts, records_sha256


def build_bundle_manifest(
    *,
    app_version: str,
    redacted: bool,
    categories: Mapping[str, list[dict[str, object]]],
    summary: dict[str, object],
) -> dict[str, object]:
    normalized_categories = normalize_categories(categories)
    records, category_counts, records_sha256 = build_record_manifest(
        normalized_categories
    )
    unsigned_manifest = {
        "schema_version": EVIDENCE_BUNDLE_SCHEMA_VERSION,
        "record_count": len(records),
        "category_counts": category_counts,
        "records_sha256": records_sha256,
        "records": records,
    }
    bundle_sha256 = sha256_json({
        "schema_version": EVIDENCE_BUNDLE_SCHEMA_VERSION,
        "app_version": app_version,
        "redacted": redacted,
        "categories": normalized_categories,
        "summary": summary,
        "manifest": unsigned_manifest,
    })
    return {**unsigned_manifest, "bundle_sha256": bundle_sha256}


def verify_bundle_payload(payload: dict[str, object]) -> dict[str, object]:
    unexpected_keys = sorted(set(payload) - _BUNDLE_KEYS)
    if unexpected_keys:
        return {
            "valid": False,
            "provided_sha256": None,
            "expected_sha256": None,
            "record_count": 0,
            "reason": f"허용되지 않은 필드가 있습니다: {', '.join(unexpected_keys)}",
        }
    if payload.get("schema_version") != EVIDENCE_BUNDLE_SCHEMA_VERSION:
        return {
            "valid": False,
            "provided_sha256": None,
            "expected_sha256": None,
            "record_count": 0,
            "reason": "지원하지 않는 evidence schema입니다.",
        }
    if not isinstance(payload.get("app_version"), str) or not payload["app_version"]:
        return {
            "valid": False,
            "provided_sha256": None,
            "expected_sha256": None,
            "record_count": 0,
            "reason": "app_version 형식이 올바르지 않습니다.",
        }
    if not isinstance(payload.get("redacted"), bool):
        return {
            "valid": False,
            "provided_sha256": None,
            "expected_sha256": None,
            "record_count": 0,
            "reason": "redacted 형식이 올바르지 않습니다.",
        }
    manifest = payload.get("manifest")
    if not isinstance(manifest, dict):
        return {
            "valid": False,
            "provided_sha256": None,
            "expected_sha256": None,
            "record_count": 0,
            "reason": "manifest가 없습니다.",
        }
    categories = {
        "device_benchmarks": payload.get("device_benchmarks", []),
        "stt_regeneration_comparisons": payload.get(
            "stt_regeneration_comparisons", []
        ),
        "export_soak_records": payload.get("export_soak_records", []),
    }
    if any(not isinstance(items, list) for items in categories.values()):
        return {
            "valid": False,
            "provided_sha256": manifest.get("bundle_sha256"),
            "expected_sha256": None,
            "record_count": 0,
            "reason": "증거 레코드 형식이 올바르지 않습니다.",
        }
    typed_categories: dict[str, list[dict[str, object]]] = {}
    for category, items in categories.items():
        if any(not isinstance(item, dict) for item in items):
            return {
                "valid": False,
                "provided_sha256": manifest.get("bundle_sha256"),
                "expected_sha256": None,
                "record_count": 0,
                "reason": f"{category} 레코드 형식이 올바르지 않습니다.",
            }
        typed_categories[category] = items  # type: ignore[assignment]
    summary = payload.get("summary", {})
    if not isinstance(summary, dict):
        return {
            "valid": False,
            "provided_sha256": manifest.get("bundle_sha256"),
            "expected_sha256": None,
            "record_count": 0,
            "reason": "summary 형식이 올바르지 않습니다.",
        }
    expected = build_bundle_manifest(
        app_version=str(payload.get("app_version", "")),
        redacted=bool(payload.get("redacted", True)),
        categories=typed_categories,
        summary=summary,
    )
    provided_sha256 = manifest.get("bundle_sha256")
    manifest_matches = all(
        manifest.get(key) == expected[key]
        for key in [
            "schema_version",
            "record_count",
            "category_counts",
            "records_sha256",
            "records",
        ]
    )
    valid = manifest_matches and provided_sha256 == expected["bundle_sha256"]
    return {
        "valid": valid,
        "provided_sha256": provided_sha256,
        "expected_sha256": expected["bundle_sha256"],
        "record_count": expected["record_count"],
        "reason": "검증 통과" if valid else "증거 내용 또는 manifest가 변경됐습니다.",
    }
