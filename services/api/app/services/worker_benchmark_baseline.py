from __future__ import annotations

import hashlib
import json
from collections.abc import Iterable
from datetime import datetime, timezone
from uuid import uuid4

from app.schemas.verification import (
    BenchmarkMetricWindow,
    BenchmarkRegressionAssessment,
    OperatorBenchmarkBaseline,
    OperatorBenchmarkRegressionAssessment,
    OperatorBaselineCreateRequest,
    WorkerSynthesisTelemetryResponse,
)

BENCHMARK_WINDOW_SIZE = 5
BENCHMARK_MINIMUM_RECORDS = BENCHMARK_WINDOW_SIZE * 2


def percentile(values: list[float], value: int) -> float | None:
    if not values:
        return None
    ordered = sorted(values)
    index = max(0, ((len(ordered) * value + 99) // 100) - 1)
    return ordered[index]


def metric_window(
    records: list[WorkerSynthesisTelemetryResponse],
) -> BenchmarkMetricWindow:
    first = [item.first_audio_ms for item in records if item.first_audio_ms is not None]
    rtf = [item.realtime_factor for item in records if item.realtime_factor is not None]
    handoff = [
        item.final_handoff_error_ms
        for item in records
        if item.final_handoff_error_ms is not None
    ]
    failures = sum(not item.succeeded for item in records)
    first_p95 = percentile([float(item) for item in first], 95)
    handoff_p95 = percentile([float(item) for item in handoff], 95)
    return BenchmarkMetricWindow(
        records=len(records),
        failure_rate=failures / len(records) if records else 0.0,
        p95_first_audio_ms=round(first_p95) if first_p95 is not None else None,
        p95_realtime_factor=percentile([float(item) for item in rtf], 95),
        p95_final_handoff_error_ms=(
            round(handoff_p95) if handoff_p95 is not None else None
        ),
    )


def regression_reasons(
    baseline: BenchmarkMetricWindow,
    current: BenchmarkMetricWindow,
) -> tuple[list[str], bool]:
    reasons: list[str] = []
    severe = False
    if current.failure_rate > baseline.failure_rate + 0.05:
        reasons.append(
            f"실패율이 {baseline.failure_rate * 100:.1f}%에서 "
            f"{current.failure_rate * 100:.1f}%로 증가했습니다."
        )
        severe = current.failure_rate >= 0.2

    comparisons = [
        (
            "첫 음성 P95",
            baseline.p95_first_audio_ms,
            current.p95_first_audio_ms,
            1.25,
            100.0,
            "ms",
        ),
        (
            "RTF P95",
            baseline.p95_realtime_factor,
            current.p95_realtime_factor,
            1.20,
            0.05,
            "",
        ),
        (
            "최종 교체 오차 P95",
            baseline.p95_final_handoff_error_ms,
            current.p95_final_handoff_error_ms,
            1.50,
            50.0,
            "ms",
        ),
    ]
    for label, before_value, after_value, ratio, absolute_delta, suffix in comparisons:
        if before_value is None or after_value is None:
            continue
        before = float(before_value)
        after = float(after_value)
        if after > before * ratio and after - before >= absolute_delta:
            reasons.append(
                f"{label}가 {before:.3g}{suffix}에서 {after:.3g}{suffix}로 악화됐습니다."
            )
    return reasons, severe


def automatic_assessment(
    records: list[WorkerSynthesisTelemetryResponse],
) -> BenchmarkRegressionAssessment:
    ordered = sorted(records, key=lambda item: item.recorded_at)
    if len(ordered) < BENCHMARK_MINIMUM_RECORDS:
        return BenchmarkRegressionAssessment(
            status="insufficient",
            minimum_records=BENCHMARK_MINIMUM_RECORDS,
            available_records=len(ordered),
            reasons=[
                "비중첩 기준선과 최근 구간을 만들려면 "
                f"최소 {BENCHMARK_MINIMUM_RECORDS}건이 필요합니다."
            ],
        )
    baseline = metric_window(ordered[:BENCHMARK_WINDOW_SIZE])
    current = metric_window(ordered[-BENCHMARK_WINDOW_SIZE:])
    reasons, severe = regression_reasons(baseline, current)
    status = "stable" if not reasons else "regressed" if severe or len(reasons) >= 2 else "warning"
    return BenchmarkRegressionAssessment(
        status=status,
        minimum_records=BENCHMARK_MINIMUM_RECORDS,
        available_records=len(ordered),
        baseline=baseline,
        current=current,
        reasons=reasons,
    )


def group_key_from_values(values: Iterable[str]) -> str:
    return "|".join(value.strip() for value in values)


def group_key_for_record(item: WorkerSynthesisTelemetryResponse) -> str:
    return group_key_from_values((
        item.engine_id,
        item.preset_id,
        item.model_id,
        item.model_version,
        item.model_digest,
        item.device_profile,
        item.accelerator_name,
        item.gpu_name,
    ))


def group_key_for_request(payload: OperatorBaselineCreateRequest) -> str:
    return group_key_from_values((
        payload.engine_id,
        payload.preset_id,
        payload.model_id,
        payload.model_version,
        payload.model_digest,
        payload.device_profile,
        payload.accelerator_name,
        payload.gpu_name,
    ))


def create_operator_baseline(
    payload: OperatorBaselineCreateRequest,
    records: list[WorkerSynthesisTelemetryResponse],
    actor: str,
) -> OperatorBenchmarkBaseline:
    group_key = group_key_for_request(payload)
    matching = sorted(
        (item for item in records if group_key_for_record(item) == group_key),
        key=lambda item: item.recorded_at,
    )
    if len(matching) < BENCHMARK_WINDOW_SIZE:
        raise ValueError(
            f"운영자 기준선을 확정하려면 같은 조건의 측정이 최소 "
            f"{BENCHMARK_WINDOW_SIZE}건 필요합니다."
        )
    source = matching[-BENCHMARK_WINDOW_SIZE:]
    source_payload = [
        {"id": item.id, "recorded_at": item.recorded_at.isoformat()}
        for item in source
    ]
    source_sha256 = hashlib.sha256(
        json.dumps(
            source_payload,
            ensure_ascii=False,
            sort_keys=True,
            separators=(",", ":"),
        ).encode("utf-8")
    ).hexdigest()
    return OperatorBenchmarkBaseline(
        baseline_id=f"obl-{uuid4().hex}",
        group_key=group_key,
        engine_id=payload.engine_id,
        preset_id=payload.preset_id,
        model_id=payload.model_id,
        model_version=payload.model_version,
        model_digest=payload.model_digest,
        device_profile=payload.device_profile,
        accelerator_name=payload.accelerator_name,
        gpu_name=payload.gpu_name,
        source_records=len(source),
        source_records_sha256=source_sha256,
        metrics=metric_window(source),
        created_at=datetime.now(timezone.utc),
        actor=actor,
        note=payload.note.strip(),
    )


def operator_assessment(
    baseline: OperatorBenchmarkBaseline | None,
    records: list[WorkerSynthesisTelemetryResponse],
) -> OperatorBenchmarkRegressionAssessment | None:
    if baseline is None:
        return None
    ordered = sorted(records, key=lambda item: item.recorded_at)
    if len(ordered) < BENCHMARK_WINDOW_SIZE:
        return OperatorBenchmarkRegressionAssessment(
            baseline_id=baseline.baseline_id,
            status="insufficient",
            available_records=len(ordered),
            current=None,
            reasons=[f"최근 측정이 {BENCHMARK_WINDOW_SIZE}건 미만입니다."],
        )
    current = metric_window(ordered[-BENCHMARK_WINDOW_SIZE:])
    reasons, severe = regression_reasons(baseline.metrics, current)
    status = "stable" if not reasons else "regressed" if severe or len(reasons) >= 2 else "warning"
    return OperatorBenchmarkRegressionAssessment(
        baseline_id=baseline.baseline_id,
        status=status,
        available_records=len(ordered),
        current=current,
        reasons=reasons,
    )
