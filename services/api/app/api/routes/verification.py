from datetime import datetime, timezone
from pathlib import Path
from time import perf_counter
from typing import Annotated
from uuid import uuid4

from fastapi import APIRouter, File, Form, HTTPException, Request, UploadFile, status
from starlette.concurrency import run_in_threadpool

from app.schemas.verification import (
    DeviceBenchmarkRequest,
    DeviceBenchmarkResponse,
    DeviceBenchmarkSummaryResponse,
    SttBatchVerificationRequest,
    SttBatchVerificationResponse,
    SttMeasurementRequest,
    SttMeasurementResponse,
    SttProbeResponse,
    SttSegmentVerificationResponse,
    WorkerSynthesisTelemetryResponse,
    WorkerTelemetrySummaryResponse,
)
from app.services import stt_evaluation

router = APIRouter()


def _percentile(values: list[float], percentile: int) -> float | None:
    if not values:
        return None
    ordered = sorted(values)
    index = max(0, ((len(ordered) * percentile + 99) // 100) - 1)
    return ordered[index]


def _percentile95(values: list[int]) -> int | None:
    value = _percentile([float(item) for item in values], 95)
    return round(value) if value is not None else None


def _percentile50(values: list[int]) -> int | None:
    value = _percentile([float(item) for item in values], 50)
    return round(value) if value is not None else None


def _benchmark_summary(items: list[DeviceBenchmarkResponse]) -> DeviceBenchmarkSummaryResponse:
    required_profiles = ["cuda", "apple-silicon", "cpu", "android", "ios"]
    required_minutes = [10, 30, 60]
    certification_profiles = ["android", "ios"]
    certification_scenarios = [
        "baseline",
        "network-switch",
        "background-resume",
        "installed-pwa",
    ]
    latest: dict[tuple[str, int], DeviceBenchmarkResponse] = {}
    latest_certification: dict[tuple[str, str, int], DeviceBenchmarkResponse] = {}
    for item in sorted(items, key=lambda value: value.recorded_at):
        latest[(item.device_profile, item.sample_minutes)] = item
        if item.device_profile in certification_profiles:
            latest_certification[(
                item.device_profile,
                item.scenario,
                item.sample_minutes,
            )] = item
    coverage = []
    missing = []
    for profile in required_profiles:
        for minutes in required_minutes:
            item = latest.get((profile, minutes))
            coverage.append({
                "profile": profile,
                "sample_minutes": minutes,
                "recorded": item is not None,
                "latest_status": item.status if item else None,
                "latest_realtime_factor": item.realtime_factor if item else None,
            })
            if item is None:
                missing.append(f"{profile}:{minutes}m")
    certification_coverage = []
    missing_certifications = []
    for profile in certification_profiles:
        for scenario in certification_scenarios:
            for minutes in required_minutes:
                item = latest_certification.get((profile, scenario, minutes))
                certification_coverage.append({
                    "profile": profile,
                    "scenario": scenario,
                    "sample_minutes": minutes,
                    "recorded": item is not None,
                    "latest_status": item.status if item else None,
                })
                if item is None:
                    missing_certifications.append(
                        f"{profile}:{scenario}:{minutes}m"
                    )
    grouped: dict[tuple[str, str, str, str, str, str, str, str], list[DeviceBenchmarkResponse]] = {}
    for item in items:
        grouped.setdefault(
            (
                item.device_profile,
                item.engine_id,
                item.model_id,
                item.model_version,
                item.model_digest,
                item.accelerator_name,
                item.gpu_name,
                item.preset_id,
            ),
            [],
        ).append(item)
    metric_groups = []
    for (
        profile,
        engine_id,
        model_id,
        model_version,
        model_digest,
        accelerator_name,
        gpu_name,
        preset_id,
    ), records in sorted(grouped.items()):
        metric_groups.append({
            "device_profile": profile,
            "engine_id": engine_id,
            "model_id": model_id,
            "model_version": model_version,
            "model_digest": model_digest,
            "accelerator_name": accelerator_name,
            "gpu_name": gpu_name,
            "preset_id": preset_id,
            "records": len(records),
            "ready_records": sum(item.status == "ready" for item in records),
            "failure_rate": sum(item.status == "failed" for item in records) / len(records),
            "average_realtime_factor": sum(item.realtime_factor for item in records) / len(records),
            "p50_realtime_factor": float(
                _percentile([item.realtime_factor for item in records], 50) or 0
            ),
            "p95_realtime_factor": float(
                _percentile([item.realtime_factor for item in records], 95) or 0
            ),
            "p50_first_audio_ms": _percentile50([
                item.first_audio_ms for item in records if item.first_audio_ms is not None
            ]),
            "p95_first_audio_ms": _percentile95([
                item.first_audio_ms for item in records if item.first_audio_ms is not None
            ]),
            "p95_sse_reconnect_ms": _percentile95([
                item.sse_reconnect_ms for item in records if item.sse_reconnect_ms is not None
            ]),
            "p95_audio_fetch_recovery_ms": _percentile95([
                item.audio_fetch_recovery_ms
                for item in records if item.audio_fetch_recovery_ms is not None
            ]),
            "p95_playback_interruption_ms": _percentile95([
                item.playback_interruption_ms
                for item in records if item.playback_interruption_ms is not None
            ]),
            "p95_seam_waited_ms": _percentile95([
                item.seam_p95_waited_ms
                for item in records if item.seam_p95_waited_ms is not None
            ]),
            "p95_seam_decode_ms": _percentile95([
                item.seam_p95_decode_ms
                for item in records if item.seam_p95_decode_ms is not None
            ]),
            "p50_final_handoff_error_ms": _percentile50([
                item.final_handoff_error_ms
                for item in records if item.final_handoff_error_ms is not None
            ]),
            "p95_final_handoff_error_ms": _percentile95([
                item.final_handoff_error_ms
                for item in records if item.final_handoff_error_ms is not None
            ]),
        })
    return DeviceBenchmarkSummaryResponse(
        total_records=len(items),
        ready_records=sum(item.status == "ready" for item in items),
        warning_records=sum(item.status == "warning" for item in items),
        failed_records=sum(item.status == "failed" for item in items),
        coverage=coverage,
        missing_scenarios=missing,
        certification_coverage=certification_coverage,
        missing_certifications=missing_certifications,
        metric_groups=metric_groups,
    )


@router.post("/device-benchmarks", response_model=DeviceBenchmarkResponse)
async def record_device_benchmark(
    payload: DeviceBenchmarkRequest,
    request: Request,
) -> DeviceBenchmarkResponse:
    realtime_factor = payload.processing_seconds / payload.audio_duration_seconds
    scenario_requires_recovery = payload.scenario in {
        "network-switch",
        "background-resume",
        "installed-pwa",
    }
    recovery_failed = scenario_requires_recovery and (
        payload.sse_reconnected is False
        or payload.audio_fetch_recovered is False
    )
    recovery_unverified = scenario_requires_recovery and (
        payload.sse_reconnected is None
        or payload.audio_fetch_recovered is None
    )
    recovery_timing_unverified = scenario_requires_recovery and (
        payload.sse_reconnect_ms is None
        or payload.audio_fetch_recovery_ms is None
        or payload.playback_interruption_ms is None
    )
    soak_duration_incomplete = (
        payload.soak_elapsed_seconds is not None
        and payload.soak_elapsed_seconds < payload.sample_minutes * 60 * 0.98
    )
    soak_duration_unverified = (
        payload.device_profile in {"android", "ios"}
        and payload.soak_elapsed_seconds is None
    )
    if (
        not payload.succeeded
        or not payload.playback_completed
        or payload.failure_count
        or recovery_failed
    ):
        benchmark_status = "failed"
    elif (
        realtime_factor > 1.0
        or payload.retry_count
        or recovery_unverified
        or recovery_timing_unverified
        or soak_duration_incomplete
        or soak_duration_unverified
        or (payload.first_audio_ms is not None and payload.first_audio_ms > 5000)
        or (payload.seam_p95_ms is not None and payload.seam_p95_ms > 250)
        or (
            payload.seam_p95_decode_ms is not None
            and payload.seam_p95_decode_ms > 250
        )
        or (payload.sse_reconnect_ms is not None and payload.sse_reconnect_ms > 5000)
        or (
            payload.audio_fetch_recovery_ms is not None
            and payload.audio_fetch_recovery_ms > 5000
        )
        or (
            payload.playback_interruption_ms is not None
            and payload.playback_interruption_ms > 2000
        )
        or (
            payload.final_handoff_error_ms is not None
            and payload.final_handoff_error_ms > 250
        )
    ):
        benchmark_status = "warning"
    else:
        benchmark_status = "ready"
    response = DeviceBenchmarkResponse(
        **payload.model_dump(),
        id=str(uuid4()),
        recorded_at=datetime.now(timezone.utc),
        realtime_factor=realtime_factor,
        status=benchmark_status,
    )
    request.app.state.device_benchmark_store.append(response.model_dump(mode="json"))
    return response


@router.get("/device-benchmarks", response_model=list[DeviceBenchmarkResponse])
async def list_device_benchmarks(request: Request) -> list[DeviceBenchmarkResponse]:
    return [
        DeviceBenchmarkResponse.model_validate(item)
        for item in request.app.state.device_benchmark_store.list()
    ]


@router.get("/device-benchmarks/summary", response_model=DeviceBenchmarkSummaryResponse)
async def summarize_device_benchmarks(request: Request) -> DeviceBenchmarkSummaryResponse:
    items = [
        DeviceBenchmarkResponse.model_validate(item)
        for item in request.app.state.device_benchmark_store.list(limit=1000)
    ]
    return _benchmark_summary(items)


_BENCHMARK_WINDOW_SIZE = 5
_BENCHMARK_MINIMUM_RECORDS = _BENCHMARK_WINDOW_SIZE * 2


def _worker_metric_window(
    records: list[WorkerSynthesisTelemetryResponse],
) -> dict[str, object]:
    first = [item.first_audio_ms for item in records if item.first_audio_ms is not None]
    rtf = [item.realtime_factor for item in records if item.realtime_factor is not None]
    handoff = [
        item.final_handoff_error_ms
        for item in records
        if item.final_handoff_error_ms is not None
    ]
    failures = sum(not item.succeeded for item in records)
    return {
        "records": len(records),
        "failure_rate": failures / len(records) if records else 0.0,
        "p95_first_audio_ms": _percentile95(first),
        "p95_realtime_factor": _percentile(rtf, 95),
        "p95_final_handoff_error_ms": _percentile95(handoff),
    }


def _regression_assessment(
    records: list[WorkerSynthesisTelemetryResponse],
) -> dict[str, object]:
    ordered = sorted(records, key=lambda item: item.recorded_at)
    if len(ordered) < _BENCHMARK_MINIMUM_RECORDS:
        return {
            "status": "insufficient",
            "minimum_records": _BENCHMARK_MINIMUM_RECORDS,
            "available_records": len(ordered),
            "baseline": None,
            "current": None,
            "reasons": [
                "비중첩 기준선과 최근 구간을 만들려면 "
                f"최소 {_BENCHMARK_MINIMUM_RECORDS}건이 필요합니다."
            ],
        }

    baseline = _worker_metric_window(ordered[:_BENCHMARK_WINDOW_SIZE])
    current = _worker_metric_window(ordered[-_BENCHMARK_WINDOW_SIZE:])
    reasons: list[str] = []
    severe = False

    baseline_failure = float(baseline["failure_rate"])
    current_failure = float(current["failure_rate"])
    if current_failure > baseline_failure + 0.05:
        reasons.append(
            f"실패율이 {baseline_failure * 100:.1f}%에서 "
            f"{current_failure * 100:.1f}%로 증가했습니다."
        )
        severe = current_failure >= 0.2

    comparisons = [
        (
            "첫 음성 P95",
            baseline["p95_first_audio_ms"],
            current["p95_first_audio_ms"],
            1.25,
            100.0,
            "ms",
        ),
        (
            "RTF P95",
            baseline["p95_realtime_factor"],
            current["p95_realtime_factor"],
            1.20,
            0.05,
            "",
        ),
        (
            "최종 교체 오차 P95",
            baseline["p95_final_handoff_error_ms"],
            current["p95_final_handoff_error_ms"],
            1.50,
            50.0,
            "ms",
        ),
    ]
    for label, baseline_value, current_value, ratio, absolute_delta, suffix in comparisons:
        if baseline_value is None or current_value is None:
            continue
        before = float(baseline_value)
        after = float(current_value)
        if after > before * ratio and after - before >= absolute_delta:
            reasons.append(
                f"{label}가 {before:.3g}{suffix}에서 {after:.3g}{suffix}로 악화됐습니다."
            )

    if not reasons:
        status = "stable"
    elif severe or len(reasons) >= 2:
        status = "regressed"
    else:
        status = "warning"
    return {
        "status": status,
        "minimum_records": _BENCHMARK_MINIMUM_RECORDS,
        "available_records": len(ordered),
        "baseline": baseline,
        "current": current,
        "reasons": reasons,
    }


def _worker_telemetry_summary(
    items: list[WorkerSynthesisTelemetryResponse],
) -> WorkerTelemetrySummaryResponse:
    grouped: dict[
        tuple[str, str, str, str, str, str, str, str],
        list[WorkerSynthesisTelemetryResponse],
    ] = {}
    for item in items:
        grouped.setdefault((
            item.engine_id,
            item.preset_id,
            item.model_id,
            item.model_version,
            item.model_digest,
            item.device_profile,
            item.accelerator_name,
            item.gpu_name,
        ), []).append(item)
    groups = []
    for key, records in sorted(grouped.items()):
        (
            engine_id,
            preset_id,
            model_id,
            model_version,
            model_digest,
            device_profile,
            accelerator_name,
            gpu_name,
        ) = key
        rtf = [item.realtime_factor for item in records if item.realtime_factor is not None]
        first = [item.first_audio_ms for item in records if item.first_audio_ms is not None]
        handoff = [
            item.final_handoff_error_ms
            for item in records
            if item.final_handoff_error_ms is not None
        ]
        success = sum(item.succeeded for item in records)
        groups.append({
            "engine_id": engine_id,
            "preset_id": preset_id,
            "model_id": model_id,
            "model_version": model_version,
            "model_digest": model_digest,
            "device_profile": device_profile,
            "accelerator_name": accelerator_name,
            "gpu_name": gpu_name,
            "records": len(records),
            "success_records": success,
            "failure_rate": (len(records) - success) / len(records),
            "p50_first_audio_ms": _percentile50(first),
            "p95_first_audio_ms": _percentile95(first),
            "p50_realtime_factor": _percentile(rtf, 50),
            "p95_realtime_factor": _percentile(rtf, 95),
            "p50_final_handoff_error_ms": _percentile50(handoff),
            "p95_final_handoff_error_ms": _percentile95(handoff),
            "regression": _regression_assessment(records),
        })
    return WorkerTelemetrySummaryResponse(
        total_records=len(items),
        success_records=sum(item.succeeded for item in items),
        failed_records=sum(not item.succeeded for item in items),
        metric_groups=groups,
    )


@router.get(
    "/worker-telemetry",
    response_model=list[WorkerSynthesisTelemetryResponse],
)
async def list_worker_telemetry(request: Request) -> list[WorkerSynthesisTelemetryResponse]:
    return [
        WorkerSynthesisTelemetryResponse.model_validate(item)
        for item in request.app.state.worker_telemetry_store.list(limit=1000)
    ]


@router.get(
    "/worker-telemetry/summary",
    response_model=WorkerTelemetrySummaryResponse,
)
async def summarize_worker_telemetry(request: Request) -> WorkerTelemetrySummaryResponse:
    items = [
        WorkerSynthesisTelemetryResponse.model_validate(item)
        for item in request.app.state.worker_telemetry_store.list(limit=5000)
    ]
    return _worker_telemetry_summary(items)


@router.post("/stt/measure", response_model=SttMeasurementResponse)
async def measure_stt(payload: SttMeasurementRequest) -> SttMeasurementResponse:
    return stt_evaluation.measure_stt(payload)


@router.get("/stt/probe", response_model=SttProbeResponse)
async def probe_stt(request: Request) -> SttProbeResponse:
    adapter = request.app.state.stt_adapter
    probe = adapter.probe()
    return SttProbeResponse(
        engine_id=probe.engine_id,
        ready=probe.ready,
        reason=probe.reason,
        model_name=adapter.model_name,
        device=adapter.device,
        compute_type=adapter.compute_type,
    )


@router.post("/stt/transcribe", response_model=SttMeasurementResponse)
async def transcribe_andmeasure_stt(
    request: Request,
    audio: Annotated[UploadFile, File()],
    reference_text: Annotated[str, Form(min_length=1, max_length=20000)],
) -> SttMeasurementResponse:
    adapter = request.app.state.stt_adapter
    probe = adapter.probe()
    if not probe.ready:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"SOA-6201: {probe.reason}",
        )
    suffix = Path(audio.filename or "sample.wav").suffix.lower()
    if suffix not in {".wav", ".mp3", ".flac", ".m4a"}:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="SOA-6202: WAV, MP3, FLAC, M4A 음원만 측정할 수 있습니다.",
        )
    target = request.app.state.settings.stt_path / f"{uuid4()}{suffix}"
    target.parent.mkdir(parents=True, exist_ok=True)
    total = 0
    try:
        with target.open("wb") as stream:
            while chunk := await audio.read(1024 * 1024):
                total += len(chunk)
                if total > request.app.state.settings.stt_max_file_bytes:
                    raise HTTPException(
                        status_code=status.HTTP_413_CONTENT_TOO_LARGE,
                        detail="SOA-6204: STT 측정 음원 크기 제한을 초과했습니다.",
                    )
                stream.write(chunk)
        started = perf_counter()
        transcript, duration = await run_in_threadpool(adapter.transcribe, target)
        elapsed = perf_counter() - started
    finally:
        target.unlink(missing_ok=True)
    if not transcript:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="SOA-6203: STT 결과가 비어 있습니다.",
        )
    return measure_stt(SttMeasurementRequest(
        reference_text=reference_text,
        transcript_text=transcript,
        engine_id=adapter.probe().engine_id,
        model_id=adapter.model_name,
        device_profile=adapter.device,
        audio_duration_seconds=duration,
        processing_seconds=elapsed,
    ))


@router.post("/stt/verify-segments", response_model=SttBatchVerificationResponse)
async def verify_stt_segments(
    payload: SttBatchVerificationRequest,
    request: Request,
) -> SttBatchVerificationResponse:
    adapter = request.app.state.stt_adapter
    probe = adapter.probe()
    if not probe.ready:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"SOA-6201: {probe.reason}",
        )
    started = perf_counter()
    results: list[SttSegmentVerificationResponse] = []
    candidates: list[str] = []
    blocked: list[str] = []
    for segment in payload.segments:
        path = request.app.state.audio_store.resolve(segment.audio_filename)
        if path is None:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                detail=(
                    "SOA-6205: STT 검수 음원을 찾을 수 없습니다: "
                    f"{segment.segment_id}"
                ),
            )
        transcribe_started = perf_counter()
        transcript, duration = await run_in_threadpool(adapter.transcribe, path)
        elapsed = perf_counter() - transcribe_started
        measurement = stt_evaluation.measure_stt(SttMeasurementRequest(
            reference_text=segment.reference_text,
            transcript_text=transcript,
            engine_id=probe.engine_id,
            model_id=adapter.model_name,
            device_profile=adapter.device,
            audio_duration_seconds=duration,
            processing_seconds=elapsed,
        ))
        reasons = stt_evaluation.regeneration_reasons(
            measurement,
            payload.character_error_threshold,
            payload.word_error_threshold,
        )
        needs_regeneration = bool(reasons)
        regeneration_allowed = (
            needs_regeneration
            and segment.regeneration_attempts < payload.max_regeneration_attempts
        )
        if regeneration_allowed:
            candidates.append(segment.segment_id)
        elif needs_regeneration:
            blocked.append(segment.segment_id)
        results.append(SttSegmentVerificationResponse(
            segment_id=segment.segment_id,
            audio_filename=segment.audio_filename,
            transcript_text=transcript,
            character_error_rate=measurement.character_error_rate,
            word_error_rate=measurement.word_error_rate,
            critical_tokens=measurement.critical_tokens,
            realtime_factor=measurement.realtime_factor,
            needs_regeneration=needs_regeneration,
            regeneration_allowed=regeneration_allowed,
            reasons=reasons,
        ))
    selected = candidates[:payload.max_regenerations_per_run]
    blocked.extend(candidates[payload.max_regenerations_per_run:])
    return SttBatchVerificationResponse(
        engine_id=probe.engine_id,
        model_id=adapter.model_name,
        device_profile=adapter.device,
        results=results,
        regeneration_segment_ids=selected,
        blocked_segment_ids=blocked,
        processing_seconds=perf_counter() - started,
    )
