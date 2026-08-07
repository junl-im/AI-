from __future__ import annotations

import hashlib
import json
import math
from collections.abc import Mapping
from dataclasses import asdict, dataclass
from datetime import datetime, timezone
from typing import Any

RUNTIME_SOAK_SCHEMA_VERSION = "runtime-soak/2"


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


@dataclass(frozen=True)
class RuntimeRecoveryEvent:
    kind: str
    target: str
    started_at: str
    recovered_at: str | None
    ok: bool
    recovery_seconds: float | None
    error: str | None = None


def _percentile(values: list[float], percentile: float) -> float | None:
    if not values:
        return None
    ordered = sorted(values)
    rank = max(0, math.ceil(percentile * len(ordered)) - 1)
    return round(ordered[rank], 2)


def _is_planned_recovery_failure(
    sample: RuntimeProbeSample,
    recovery_events: list[RuntimeRecoveryEvent],
) -> bool:
    if sample.ok:
        return False
    try:
        sample_at = datetime.fromisoformat(sample.at)
    except ValueError:
        return False
    for event in recovery_events:
        if event.target != sample.target:
            continue
        try:
            started_at = datetime.fromisoformat(event.started_at)
            recovered_at = (
                datetime.fromisoformat(event.recovered_at)
                if event.recovered_at is not None
                else None
            )
        except ValueError:
            continue
        within_window = recovered_at is None or sample_at <= recovered_at
        if sample_at >= started_at and within_window:
            return True
    return False


def _target_summary(
    samples: list[RuntimeProbeSample],
    interval_seconds: float,
    recovery_events: list[RuntimeRecoveryEvent],
) -> dict[str, object]:
    success = [sample for sample in samples if sample.ok]
    planned_failures = [
        sample
        for sample in samples
        if _is_planned_recovery_failure(sample, recovery_events)
    ]
    planned_failure_ids = {id(sample) for sample in planned_failures}
    unexpected_failures = [
        sample
        for sample in samples
        if not sample.ok and id(sample) not in planned_failure_ids
    ]
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
        if sample.ok or id(sample) in planned_failure_ids:
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
    effective_samples = len(success) + len(unexpected_failures)
    return {
        "samples": len(samples),
        "successes": len(success),
        "failures": len(unexpected_failures),
        "planned_recovery_failures": len(planned_failures),
        "total_failures": len(samples) - len(success),
        "success_rate": (
            round(len(success) / effective_samples, 4)
            if effective_samples
            else 0
        ),
        "p50_latency_ms": _percentile(latencies, 0.50),
        "p95_latency_ms": _percentile(latencies, 0.95),
        "longest_outage_seconds": round(longest_failures * interval_seconds, 2),
        "planned_recovery_outage_seconds": round(
            len(planned_failures) * interval_seconds,
            2,
        ),
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


def _numeric(mapping: Mapping[str, object], key: str) -> float | None:
    value = mapping.get(key)
    if isinstance(value, (int, float)) and not isinstance(value, bool):
        return float(value)
    return None


def compare_runtime_soak_reports(
    current_targets: Mapping[str, object],
    baseline_report: Mapping[str, object] | None,
) -> dict[str, object]:
    if not baseline_report:
        return {
            "status": "unavailable",
            "baseline_report_sha256": None,
            "reasons": [],
            "targets": {},
        }
    baseline_targets = baseline_report.get("targets")
    if not isinstance(baseline_targets, Mapping):
        return {
            "status": "unavailable",
            "baseline_report_sha256": baseline_report.get("report_sha256"),
            "reasons": ["이전 soak 보고서에 target 요약이 없습니다."],
            "targets": {},
        }

    reasons: list[str] = []
    comparisons: dict[str, object] = {}
    for target, current_value in current_targets.items():
        baseline_value = baseline_targets.get(target)
        if not isinstance(current_value, Mapping) or not isinstance(
            baseline_value,
            Mapping,
        ):
            continue
        target_reasons: list[str] = []
        current_latency = _numeric(current_value, "p95_latency_ms")
        baseline_latency = _numeric(baseline_value, "p95_latency_ms")
        if current_latency is not None and baseline_latency is not None:
            if current_latency > max(baseline_latency * 1.35, baseline_latency + 75):
                target_reasons.append(
                    f"P95 응답 {baseline_latency:g}ms → {current_latency:g}ms"
                )

        current_success = _numeric(current_value, "success_rate")
        baseline_success = _numeric(baseline_value, "success_rate")
        if current_success is not None and baseline_success is not None:
            if baseline_success - current_success >= 0.01:
                target_reasons.append(
                    f"성공률 {baseline_success:.2%} → {current_success:.2%}"
                )

        current_memory = _numeric(current_value, "memory_growth_mb")
        baseline_memory = _numeric(baseline_value, "memory_growth_mb")
        if current_memory is not None and baseline_memory is not None:
            if current_memory - baseline_memory > 64:
                target_reasons.append(
                    f"메모리 증가 {baseline_memory:g}MiB → {current_memory:g}MiB"
                )

        current_descriptors = _numeric(
            current_value,
            "open_file_descriptors_growth",
        )
        baseline_descriptors = _numeric(
            baseline_value,
            "open_file_descriptors_growth",
        )
        if current_descriptors is not None and baseline_descriptors is not None:
            if current_descriptors - baseline_descriptors > 16:
                target_reasons.append(
                    "열린 파일·연결 증가 "
                    f"{baseline_descriptors:g}개 → {current_descriptors:g}개"
                )

        current_recovery = _numeric(current_value, "p95_recovery_seconds")
        baseline_recovery = _numeric(baseline_value, "p95_recovery_seconds")
        if current_recovery is not None and baseline_recovery is not None:
            if current_recovery > max(baseline_recovery * 1.5, baseline_recovery + 10):
                target_reasons.append(
                    f"P95 복구 {baseline_recovery:g}초 → {current_recovery:g}초"
                )

        comparisons[str(target)] = {
            "status": "regressed" if target_reasons else "stable",
            "reasons": target_reasons,
        }
        reasons.extend(f"{target} {reason}" for reason in target_reasons)

    return {
        "status": "regressed" if reasons else "stable",
        "baseline_report_sha256": baseline_report.get("report_sha256"),
        "reasons": reasons,
        "targets": comparisons,
    }


def build_runtime_soak_report(
    *,
    app_version: str,
    started_at: str,
    completed_at: str,
    interval_seconds: float,
    samples: list[RuntimeProbeSample],
    recovery_events: list[RuntimeRecoveryEvent] | None = None,
    baseline_report: Mapping[str, object] | None = None,
    max_memory_growth_mb: float = 128.0,
    max_open_file_descriptors_growth: int = 32,
    max_outage_seconds: float = 30.0,
    max_recovery_seconds: float = 45.0,
    minimum_success_rate: float = 0.99,
) -> dict[str, object]:
    recovery_events = recovery_events or []
    targets = sorted({sample.target for sample in samples})
    summaries = {
        target: _target_summary(
            [sample for sample in samples if sample.target == target],
            interval_seconds,
            [event for event in recovery_events if event.target == target],
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

    for event in recovery_events:
        if not event.ok:
            reasons.append(f"{event.target} {event.kind} 복구 실패")
        elif (
            event.recovery_seconds is not None
            and event.recovery_seconds > max_recovery_seconds
        ):
            reasons.append(
                f"{event.target} {event.kind} 복구 {event.recovery_seconds:g}초"
            )

    comparison = compare_runtime_soak_reports(summaries, baseline_report)
    if comparison["status"] == "regressed":
        warnings.extend(
            f"이전 soak 대비 {reason}"
            for reason in comparison["reasons"]
            if isinstance(reason, str)
        )

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
            "max_recovery_seconds": max_recovery_seconds,
            "max_memory_growth_mb": max_memory_growth_mb,
            "max_open_file_descriptors_growth": max_open_file_descriptors_growth,
        },
        "status": status,
        "reasons": reasons,
        "warnings": warnings,
        "targets": summaries,
        "recovery_events": [asdict(event) for event in recovery_events],
        "comparison": comparison,
        "samples": [asdict(sample) for sample in samples],
    }
    report_sha256 = hashlib.sha256(
        json.dumps(
            unsigned,
            ensure_ascii=False,
            sort_keys=True,
            separators=(",", ":"),
        ).encode()
    ).hexdigest()
    return {**unsigned, "report_sha256": report_sha256}


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()
