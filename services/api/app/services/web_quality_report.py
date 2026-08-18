from __future__ import annotations

import hashlib
import json
from typing import Any

from app.version import APP_VERSION

WEB_QUALITY_SCHEMA_VERSION = 1
WEB_QUALITY_PHASES = [
    ("lock-structure", "npm run locks:check -- --component npm"),
    ("web-toolchain", "npm run quality:web-toolchain"),
    ("dependency-tree", "npm run quality:dependency-tree"),
    ("lint", "npm run lint"),
    ("typecheck", "npm run typecheck"),
    ("critical-regression", "npm run test:web-critical"),
    ("test", "npm run test:ci"),
    ("build", "npm run build"),
]
_ALLOWED_KEYS = {
    "schemaVersion",
    "mode",
    "appVersion",
    "heartbeat",
    "startedAt",
    "completedAt",
    "runtime",
    "source",
    "inputs",
    "phases",
    "dist",
    "passed",
    "evidenceSha256",
    "reportSha256",
}


def _canonical_json(value: object) -> str:
    return json.dumps(
        value,
        ensure_ascii=False,
        separators=(",", ":"),
        sort_keys=True,
    )


def _sha256(value: object) -> str:
    return hashlib.sha256(_canonical_json(value).encode()).hexdigest()


def _is_sha256(value: object) -> bool:
    return isinstance(value, str) and len(value) == 64 and all(
        char in "0123456789abcdef" for char in value
    )


def _evidence_payload(report: dict[str, Any]) -> dict[str, object]:
    phases = []
    for raw_phase in report.get("phases", []):
        if not isinstance(raw_phase, dict):
            continue
        phases.append({
            key: value
            for key, value in raw_phase.items()
            if key != "durationMs"
        })
    source = report.get("source") if isinstance(report.get("source"), dict) else {}
    return {
        "schemaVersion": report.get("schemaVersion"),
        "mode": report.get("mode"),
        "appVersion": report.get("appVersion"),
        "heartbeat": report.get("heartbeat"),
        "runtime": report.get("runtime"),
        "source": {
            "repository": source.get("repository"),
            "commitSha": source.get("commitSha"),
        },
        "inputs": report.get("inputs"),
        "phases": phases,
        "dist": report.get("dist"),
        "passed": report.get("passed"),
    }


def verify_web_quality_report(payload: dict[str, object]) -> dict[str, object]:
    unexpected = sorted(set(payload) - _ALLOWED_KEYS)
    failures: list[str] = []
    if unexpected:
        failures.append(f"허용되지 않은 필드가 있습니다: {', '.join(unexpected)}")
    if payload.get("schemaVersion") != WEB_QUALITY_SCHEMA_VERSION:
        failures.append("지원하지 않는 Web quality schema입니다.")
    if payload.get("mode") != "run":
        failures.append("실행 완료된 run report만 가져올 수 있습니다.")
    if payload.get("appVersion") != APP_VERSION:
        failures.append(f"제품 버전이 {APP_VERSION}이 아닙니다.")
    if payload.get("heartbeat") not in {"6.6", "6.7"}:
        failures.append("Heartbeat 6.6 또는 6.7 report만 지원합니다.")
    if payload.get("passed") is not True:
        failures.append("통과한 Web quality report가 아닙니다.")

    inputs = payload.get("inputs")
    if not isinstance(inputs, dict) or not _is_sha256(inputs.get("packageJsonSha256")):
        failures.append("package.json SHA-256이 없습니다.")
    if not isinstance(inputs, dict) or not _is_sha256(inputs.get("packageLockSha256")):
        failures.append("package-lock SHA-256이 없습니다.")

    phases = payload.get("phases")
    if not isinstance(phases, list) or len(phases) != len(WEB_QUALITY_PHASES):
        failures.append("Web quality phase 개수가 올바르지 않습니다.")
    else:
        for phase, (expected_id, expected_command) in zip(phases, WEB_QUALITY_PHASES, strict=True):
            if not isinstance(phase, dict):
                failures.append(f"{expected_id}: phase 형식 오류")
                continue
            if phase.get("id") != expected_id:
                failures.append(f"{expected_id}: phase 순서 불일치")
            if phase.get("command") != expected_command:
                failures.append(f"{expected_id}: 실행 명령 불일치")
            if phase.get("status") != "passed" or phase.get("exitCode") != 0:
                failures.append(f"{expected_id}: 통과하지 않은 phase")
            if not _is_sha256(phase.get("logSha256")):
                failures.append(f"{expected_id}: 로그 SHA-256 누락")

    dist = payload.get("dist")
    if not isinstance(dist, list):
        failures.append("dist manifest 형식 오류")
    else:
        for entry in dist:
            if not isinstance(entry, dict) or not _is_sha256(entry.get("sha256")):
                failures.append("dist 파일 SHA-256 형식 오류")
                break

    expected_evidence = _sha256(_evidence_payload(payload))
    unsigned = {key: value for key, value in payload.items() if key != "reportSha256"}
    expected_report = _sha256(unsigned)
    provided_evidence = payload.get("evidenceSha256")
    provided_report = payload.get("reportSha256")
    if provided_evidence != expected_evidence:
        failures.append("evidence SHA-256 불일치")
    if provided_report != expected_report:
        failures.append("report SHA-256 불일치")

    return {
        "valid": not failures,
        "bundle_sha256": provided_report if _is_sha256(provided_report) else expected_report,
        "record_sha256s": [expected_evidence],
        "schema_version": f"web-quality/{WEB_QUALITY_SCHEMA_VERSION}",
        "app_version": str(payload.get("appVersion", "")),
        "record_count": 1,
        "reason": "검증 통과" if not failures else failures[0],
    }
