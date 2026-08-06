from __future__ import annotations

import hashlib
from collections.abc import Mapping
from typing import Any

from app.services.evidence_bundle import build_record_manifest, normalize_categories, sha256_json

PRIVACY_AUDIT_SCHEMA_VERSION = "privacy-audit/1"

_BUNDLE_KEYS = {
    "schema_version",
    "app_version",
    "exported_at",
    "redacted",
    "approval_history",
    "trust_rotation",
    "benchmark_regressions",
    "device_coverage",
    "manifest",
}


def _hardware_fingerprint(group: Mapping[str, Any]) -> str:
    source = "|".join([
        str(group.get("device_profile", "")),
        str(group.get("accelerator_name", "")),
        str(group.get("gpu_name", "")),
    ])
    return hashlib.sha256(source.encode()).hexdigest()


def redact_approval_history(records: list[dict[str, object]]) -> list[dict[str, object]]:
    allowed = [
        "approval_id",
        "event",
        "voice_id",
        "at",
        "audio_sha256",
        "before_manifest_sha256",
        "after_manifest_sha256",
        "review_bundle_sha256",
        "signature_mode",
        "signing_key_id",
        "related_approval_id",
    ]
    return [
        {key: record.get(key) for key in allowed if record.get(key) is not None}
        for record in records
    ]


def summarize_trust_rotation(queue: Mapping[str, Any] | None) -> dict[str, object]:
    if queue is None:
        return {
            "available": False,
            "signing_ready": False,
            "trusted_key_count": 0,
            "item_count": 0,
            "priority_counts": {"blocked": 0, "urgent": 0, "soon": 0, "rotation": 0},
            "rotation_remaining": 0,
            "reason": "프리셋 증거 저장소가 연결되지 않아 집계하지 못했습니다.",
        }
    items = queue.get("items", [])
    typed_items = (
        [item for item in items if isinstance(item, Mapping)]
        if isinstance(items, list)
        else []
    )
    counts = {"blocked": 0, "urgent": 0, "soon": 0, "rotation": 0}
    rotation_remaining = 0
    for item in typed_items:
        priority = str(item.get("priority", ""))
        if priority in counts:
            counts[priority] += 1
        if priority == "rotation" and bool(item.get("can_resign")):
            rotation_remaining += 1
    trusted = queue.get("trusted_key_ids", [])
    trusted_count = len(trusted) if isinstance(trusted, list) else 0
    return {
        "available": True,
        "generated_at": queue.get("generated_at"),
        "warning_days": queue.get("warning_days"),
        "signing_ready": bool(queue.get("active_key_id")),
        "trusted_key_count": trusted_count,
        "item_count": len(typed_items),
        "priority_counts": counts,
        "rotation_remaining": rotation_remaining,
    }


def redact_worker_regressions(groups: list[dict[str, object]]) -> list[dict[str, object]]:
    results: list[dict[str, object]] = []
    for group in groups:
        identity = {
            "engine_id": group.get("engine_id"),
            "preset_id": group.get("preset_id"),
            "model_id": group.get("model_id"),
            "model_version": group.get("model_version"),
            "model_digest": group.get("model_digest"),
            "device_profile": group.get("device_profile"),
            "accelerator_name": group.get("accelerator_name"),
            "hardware_fingerprint_sha256": _hardware_fingerprint(group),
        }
        results.append({
            "id": sha256_json(identity)[:24],
            **identity,
            "records": group.get("records", 0),
            "success_records": group.get("success_records", 0),
            "failure_rate": group.get("failure_rate", 0),
            "p95_first_audio_ms": group.get("p95_first_audio_ms"),
            "p95_realtime_factor": group.get("p95_realtime_factor"),
            "p95_final_handoff_error_ms": group.get("p95_final_handoff_error_ms"),
            "regression": group.get("regression", {}),
        })
    return results


def redact_device_coverage(summary: Mapping[str, Any]) -> dict[str, object]:
    return {
        "id": "device-coverage",
        "total_records": summary.get("total_records", 0),
        "ready_records": summary.get("ready_records", 0),
        "warning_records": summary.get("warning_records", 0),
        "failed_records": summary.get("failed_records", 0),
        "coverage": summary.get("coverage", []),
        "missing_scenarios": summary.get("missing_scenarios", []),
        "certification_coverage": summary.get("certification_coverage", []),
        "missing_certifications": summary.get("missing_certifications", []),
    }


def _categories(payload: Mapping[str, Any]) -> dict[str, list[dict[str, object]]]:
    approval = payload.get("approval_history", [])
    regressions = payload.get("benchmark_regressions", [])
    trust = payload.get("trust_rotation", {})
    coverage = payload.get("device_coverage", {})
    return {
        "approval_history": approval if isinstance(approval, list) else [],
        "benchmark_regressions": regressions if isinstance(regressions, list) else [],
        "device_coverage": [coverage] if isinstance(coverage, dict) else [],
        "trust_rotation": [trust] if isinstance(trust, dict) else [],
    }


def build_privacy_audit_manifest(
    *,
    app_version: str,
    categories: dict[str, list[dict[str, object]]],
) -> dict[str, object]:
    normalized = normalize_categories(categories)
    records, category_counts, records_sha256 = build_record_manifest(normalized)
    unsigned = {
        "schema_version": PRIVACY_AUDIT_SCHEMA_VERSION,
        "record_count": len(records),
        "category_counts": category_counts,
        "records_sha256": records_sha256,
        "records": records,
    }
    bundle_sha256 = sha256_json({
        "schema_version": PRIVACY_AUDIT_SCHEMA_VERSION,
        "app_version": app_version,
        "redacted": True,
        "categories": normalized,
        "manifest": unsigned,
    })
    return {**unsigned, "bundle_sha256": bundle_sha256}


def build_privacy_audit_bundle(
    *,
    app_version: str,
    exported_at: object,
    approval_history: list[dict[str, object]],
    renewal_queue: Mapping[str, Any] | None,
    worker_groups: list[dict[str, object]],
    device_summary: Mapping[str, Any],
) -> dict[str, object]:
    payload: dict[str, object] = {
        "schema_version": PRIVACY_AUDIT_SCHEMA_VERSION,
        "app_version": app_version,
        "exported_at": exported_at,
        "redacted": True,
        "approval_history": redact_approval_history(approval_history),
        "trust_rotation": summarize_trust_rotation(renewal_queue),
        "benchmark_regressions": redact_worker_regressions(worker_groups),
        "device_coverage": redact_device_coverage(device_summary),
    }
    payload["manifest"] = build_privacy_audit_manifest(
        app_version=app_version,
        categories=_categories(payload),
    )
    return payload


def verify_privacy_audit_bundle(payload: dict[str, object]) -> dict[str, object]:
    unexpected = sorted(set(payload) - _BUNDLE_KEYS)
    if unexpected:
        return {
            "valid": False,
            "provided_sha256": None,
            "expected_sha256": None,
            "record_count": 0,
            "reason": f"허용되지 않은 필드가 있습니다: {', '.join(unexpected)}",
        }
    if payload.get("schema_version") != PRIVACY_AUDIT_SCHEMA_VERSION:
        return {
            "valid": False,
            "provided_sha256": None,
            "expected_sha256": None,
            "record_count": 0,
            "reason": "지원하지 않는 privacy audit schema입니다.",
        }
    if payload.get("redacted") is not True:
        return {
            "valid": False,
            "provided_sha256": None,
            "expected_sha256": None,
            "record_count": 0,
            "reason": "감사 묶음은 redacted=true여야 합니다.",
        }
    app_version = payload.get("app_version")
    manifest = payload.get("manifest")
    if not isinstance(app_version, str) or not app_version or not isinstance(manifest, dict):
        return {
            "valid": False,
            "provided_sha256": None,
            "expected_sha256": None,
            "record_count": 0,
            "reason": "app_version 또는 manifest 형식이 올바르지 않습니다.",
        }
    categories = _categories(payload)
    if any(any(not isinstance(item, dict) for item in items) for items in categories.values()):
        return {
            "valid": False,
            "provided_sha256": manifest.get("bundle_sha256"),
            "expected_sha256": None,
            "record_count": 0,
            "reason": "감사 레코드 형식이 올바르지 않습니다.",
        }
    expected = build_privacy_audit_manifest(app_version=app_version, categories=categories)
    keys = ["schema_version", "record_count", "category_counts", "records_sha256", "records"]
    valid = all(manifest.get(key) == expected[key] for key in keys)
    valid = valid and manifest.get("bundle_sha256") == expected["bundle_sha256"]
    return {
        "valid": valid,
        "provided_sha256": manifest.get("bundle_sha256"),
        "expected_sha256": expected["bundle_sha256"],
        "record_count": expected["record_count"],
        "reason": "검증 통과" if valid else "감사 내용 또는 manifest가 변경됐습니다.",
    }
