from __future__ import annotations

import hashlib
import json
import math
from dataclasses import asdict, dataclass
from datetime import datetime, timezone
from typing import Any

RUNTIME_SOAK_SCHEMA_VERSION = "runtime-soak/1"


@dataclass(frozen=True)
class RuntimeProbeSample:
    target: str
    at: str
    ok: bool
    latency_ms: int
    status_code: int | None = None
    memory_mb: float | None = None
    open_file_descriptors: int | None = None
    error: str | None = None


def _percentile(values: list[float], percentile: float) -> float | None:
    if not values:
        return None
    ordered = sorted(values)
    rank = max(0, math.ceil(percentile * len(ordered)) - 1)
    return round(ordered[rank], 2)


def _target_summary(
    samples: list[RuntimeProbeSample],
    interval_seconds: float,
) -> dict[str, object]:
    success = [sample for sample in samples if sample.ok]
    latencies = [float(sample.latency_ms) for sample in success]
    memories = [sample.memory_mb for sample in success if sample.memory_mb is not None]
    descriptors = [
        sample.open_file_descriptors
        for sample in success
        if sample.open_file_descriptors is not None
    ]
    longest_failures = 0
    current_failures = 0
    recovery_seconds: list[float] = []
    for sample in samples:
        if sample.ok:
            if current_failures:
                recovery_seconds.append(current_failures * interval_seconds)
            current_failures = 0
        else:
            current_failures += 1
            longest_failures = max(longest_failures, current_failures)
    longest_failures = max(longest_failures, current_failures)
    memory_growth = None
    if len(memories) >= 2:
        memory_growth = round(memories[-1] - memories[0], 2)
    descriptor_growth = None
    if len(descriptors) >= 2:
        descriptor_growth = descriptors[-1] - descriptors[0]
    return {
        "samples": len(samples),
        "successes": len(success),
        "failures": len(samples) - len(success),
        "success_rate": round(len(success) / len(samples), 4) if samples else 0,
        "p50_latency_ms": _percentile(latencies, 0.50),
        "p95_latency_ms": _percentile(latencies, 0.95),
        "longest_outage_seconds": round(longest_failures * interval_seconds, 2),
        "recovery_count": len(recovery_seconds),
        "p95_recovery_seconds": _percentile(recovery_seconds, 0.95),
        "memory_start_mb": memories[0] if memories else None,
        "memory_end_mb": memories[-1] if memories else None,
        "memory_peak_mb": max(memories) if memories else None,
        "memory_growth_mb": memory_growth,
        "open_file_descriptors_start": descriptors[0] if descriptors else None,
        "open_file_descriptors_end": descriptors[-1] if descriptors else None,
        "open_file_descriptors_peak": max(descriptors) if descriptors else None,
        "open_file_descriptors_growth": descriptor_growth,
    }


def build_runtime_soak_report(
    *,
    app_version: str,
    started_at: str,
    completed_at: str,
    interval_seconds: float,
    samples: list[RuntimeProbeSample],
    max_memory_growth_mb: float = 128.0,
    max_open_file_descriptors_growth: int = 32,
    max_outage_seconds: float = 30.0,
    minimum_success_rate: float = 0.99,
) -> dict[str, object]:
    targets = sorted({sample.target for sample in samples})
    summaries = {
        target: _target_summary(
            [sample for sample in samples if sample.target == target],
            interval_seconds,
        )
        for target in targets
    }
    reasons: list[str] = []
    warnings: list[str] = []
    for target, summary in summaries.items():
        success_rate = float(summary["success_rate"])
        outage = float(summary["longest_outage_seconds"])
        memory_growth = summary["memory_growth_mb"]
        descriptor_growth = summary["open_file_descriptors_growth"]
        if success_rate < minimum_success_rate:
            reasons.append(f"{target} 성공률 {success_rate:.2%}")
        if outage > max_outage_seconds:
            reasons.append(f"{target} 최장 중단 {outage:g}초")
        if isinstance(memory_growth, (int, float)) and memory_growth > max_memory_growth_mb:
            reasons.append(f"{target} 메모리 증가 {memory_growth:g}MiB")
        elif (
            isinstance(memory_growth, (int, float))
            and memory_growth > max_memory_growth_mb / 2
        ):
            warnings.append(f"{target} 메모리 증가 주의 {memory_growth:g}MiB")
        if (
            isinstance(descriptor_growth, int)
            and descriptor_growth > max_open_file_descriptors_growth
        ):
            reasons.append(f"{target} 열린 파일·연결 증가 {descriptor_growth}개")
        if int(summary["failures"]) > 0 and success_rate >= minimum_success_rate:
            warnings.append(f"{target} 일시 실패 {summary['failures']}건")
    status = "failed" if reasons else "warning" if warnings else "passed"
    unsigned: dict[str, Any] = {
        "schema_version": RUNTIME_SOAK_SCHEMA_VERSION,
        "app_version": app_version,
        "started_at": started_at,
        "completed_at": completed_at,
        "interval_seconds": interval_seconds,
        "thresholds": {
            "minimum_success_rate": minimum_success_rate,
            "max_outage_seconds": max_outage_seconds,
            "max_memory_growth_mb": max_memory_growth_mb,
            "max_open_file_descriptors_growth": max_open_file_descriptors_growth,
        },
        "status": status,
        "reasons": reasons,
        "warnings": warnings,
        "targets": summaries,
        "samples": [asdict(sample) for sample in samples],
    }
    report_sha256 = hashlib.sha256(
        json.dumps(unsigned, ensure_ascii=False, sort_keys=True, separators=(",", ":")).encode()
    ).hexdigest()
    return {**unsigned, "report_sha256": report_sha256}


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()
