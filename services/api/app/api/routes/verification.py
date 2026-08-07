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
    OperatorBaselineCreateRequest,
    OperatorBaselineHistoryEntry,
    OperatorBaselineRestorePreview,
    OperatorBaselineRestoreRequest,
    OperatorBaselineRetireRequest,
    OperatorBenchmarkBaseline,
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
from app.services.voice_review_operator import (
    VoiceReviewOperatorAuthorizationError,
    authorize_voice_review_operator,
)
from app.services.worker_benchmark_baseline import (
    BENCHMARK_MINIMUM_RECORDS,
    BENCHMARK_WINDOW_SIZE,
    automatic_assessment,
    create_operator_baseline,
    group_key_from_values,
    metric_window,
    operator_assessment,
)

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


_BENCHMARK_WINDOW_SIZE = BENCHMARK_WINDOW_SIZE
_BENCHMARK_MINIMUM_RECORDS = BENCHMARK_MINIMUM_RECORDS


def _worker_metric_window(
    records: list[WorkerSynthesisTelemetryResponse],
) -> dict[str, object]:
    return metric_window(records).model_dump(mode="json")


def _regression_assessment(
    records: list[WorkerSynthesisTelemetryResponse],
) -> dict[str, object]:
    return automatic_assessment(records).model_dump(mode="json")


def _worker_telemetry_summary(
    items: list[WorkerSynthesisTelemetryResponse],
    operator_baselines: dict[str, OperatorBenchmarkBaseline] | None = None,
) -> WorkerTelemetrySummaryResponse:
    operator_baselines = operator_baselines or {}
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
        group_key = group_key_from_values((
            engine_id,
            preset_id,
            model_id,
            model_version,
            model_digest,
            device_profile,
            accelerator_name,
            gpu_name,
        ))
        operator_baseline = operator_baselines.get(group_key)
        operator_regression = operator_assessment(operator_baseline, records)
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
            "operator_baseline": operator_baseline,
            "operator_regression": operator_regression,
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
    return _worker_telemetry_summary(
        items,
        request.app.state.operator_baseline_store.active_by_group(),
    )


def _operator_actor(request: Request) -> str:
    try:
        return authorize_voice_review_operator(
            request,
            request.app.state.settings,
        ).actor
    except VoiceReviewOperatorAuthorizationError as error:
        raise HTTPException(
            status_code=error.status_code,
            detail=f"{error.code}: {error}",
        ) from error


@router.get(
    "/worker-telemetry/operator-baselines",
    response_model=list[OperatorBenchmarkBaseline],
)
async def list_operator_baselines(request: Request) -> list[OperatorBenchmarkBaseline]:
    _operator_actor(request)
    return request.app.state.operator_baseline_store.list_active()


@router.get(
    "/worker-telemetry/operator-baselines/history",
    response_model=list[OperatorBaselineHistoryEntry],
)
async def list_operator_baseline_history(
    request: Request,
    group_key: str | None = None,
) -> list[OperatorBaselineHistoryEntry]:
    _operator_actor(request)
    return request.app.state.operator_baseline_store.history(group_key=group_key)


@router.get(
    "/worker-telemetry/operator-baselines/{baseline_id}/restore-preview",
    response_model=OperatorBaselineRestorePreview,
)
async def preview_operator_baseline_restore(
    baseline_id: str,
    request: Request,
) -> OperatorBaselineRestorePreview:
    _operator_actor(request)
    store = request.app.state.operator_baseline_store
    target = store.get(baseline_id)
    if target is None:
        raise HTTPException(
            status_code=404,
            detail="SOA-6914: 과거 운영자 기준선을 찾지 못했습니다.",
        )
    current = store.active_by_group().get(target.group_key)
    summary = [
        f"복원 대상: {target.baseline_id}",
        f"snapshot: 최근 {target.source_records}건 · {target.created_at.isoformat()}",
    ]
    will_replace = current is not None and current.baseline_id != target.baseline_id
    if will_replace:
        summary.append(f"현재 활성 기준선 {current.baseline_id}은 이력에 보존한 채 교체됩니다.")
    elif current is None:
        summary.append("현재 활성 기준선이 없어 복원 대상이 바로 활성화됩니다.")
    else:
        summary.append("이미 활성 기준선입니다. 데이터 변경은 발생하지 않습니다.")
    return OperatorBaselineRestorePreview(
        target=target,
        current_active=current,
        will_replace_active=will_replace,
        summary=summary,
    )


@router.post(
    "/worker-telemetry/operator-baselines/{baseline_id}/restore",
    response_model=OperatorBenchmarkBaseline,
)
async def restore_operator_baseline(
    baseline_id: str,
    payload: OperatorBaselineRestoreRequest,
    request: Request,
) -> OperatorBenchmarkBaseline:
    if payload.confirmation != "과거 운영자 기준선 복원":
        raise HTTPException(
            status_code=409,
            detail="SOA-6915: 확인 문구는 '과거 운영자 기준선 복원'이어야 합니다.",
        )
    actor = _operator_actor(request)
    restored = request.app.state.operator_baseline_store.restore(
        baseline_id,
        actor,
        payload.reason.strip(),
        datetime.now(timezone.utc).isoformat(),
    )
    if restored is None:
        raise HTTPException(
            status_code=404,
            detail="SOA-6914: 과거 운영자 기준선을 찾지 못했습니다.",
        )
    return restored


@router.post(
    "/worker-telemetry/operator-baselines",
    response_model=OperatorBenchmarkBaseline,
)
async def confirm_operator_baseline(
    payload: OperatorBaselineCreateRequest,
    request: Request,
) -> OperatorBenchmarkBaseline:
    if payload.confirmation != "현재 성능 기준선 확정":
        raise HTTPException(
            status_code=409,
            detail="SOA-6910: 확인 문구는 '현재 성능 기준선 확정'이어야 합니다.",
        )
    actor = _operator_actor(request)
    records = [
        WorkerSynthesisTelemetryResponse.model_validate(item)
        for item in request.app.state.worker_telemetry_store.list(limit=5000)
    ]
    try:
        baseline = create_operator_baseline(payload, records, actor)
    except ValueError as error:
        raise HTTPException(status_code=409, detail=f"SOA-6911: {error}") from error
    request.app.state.operator_baseline_store.create(baseline)
    return baseline


@router.post(
    "/worker-telemetry/operator-baselines/{baseline_id}/retire",
    response_model=dict[str, str],
)
async def retire_operator_baseline(
    baseline_id: str,
    payload: OperatorBaselineRetireRequest,
    request: Request,
) -> dict[str, str]:
    if payload.confirmation != "운영자 기준선 폐기":
        raise HTTPException(
            status_code=409,
            detail="SOA-6912: 확인 문구는 '운영자 기준선 폐기'여야 합니다.",
        )
    actor = _operator_actor(request)
    retired = request.app.state.operator_baseline_store.retire(
        baseline_id,
        actor,
        payload.reason.strip(),
        datetime.now(timezone.utc).isoformat(),
    )
    if not retired:
        raise HTTPException(status_code=404, detail="SOA-6913: 활성 기준선을 찾지 못했습니다.")
    return {"status": "retired", "baseline_id": baseline_id}


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
