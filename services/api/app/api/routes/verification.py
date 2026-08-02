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
)
from app.services.stt_metrics import character_error, critical_token_errors, word_error

router = APIRouter()


def _measure(payload: SttMeasurementRequest) -> SttMeasurementResponse:
    character = character_error(payload.reference_text, payload.transcript_text)
    word = word_error(payload.reference_text, payload.transcript_text)
    critical = critical_token_errors(payload.reference_text, payload.transcript_text)
    critical_failed = any(item["error_count"] for item in critical.values())
    realtime_factor = None
    if payload.audio_duration_seconds and payload.processing_seconds:
        realtime_factor = payload.processing_seconds / payload.audio_duration_seconds
    return SttMeasurementResponse(
        **payload.model_dump(),
        character_error_rate=character.rate,
        character_errors=character.distance,
        character_reference_length=character.reference_length,
        word_error_rate=word.rate,
        word_errors=word.distance,
        word_reference_length=word.reference_length,
        critical_tokens=critical,
        realtime_factor=realtime_factor,
        needs_regeneration=character.rate > 0.08 or word.rate > 0.15 or critical_failed,
    )


def _regeneration_reasons(
    measurement: SttMeasurementResponse,
    character_threshold: float,
    word_threshold: float,
) -> list[str]:
    reasons: list[str] = []
    if measurement.character_error_rate > character_threshold:
        reasons.append("character_error_rate")
    if measurement.word_error_rate > word_threshold:
        reasons.append("word_error_rate")
    for category, metric in measurement.critical_tokens.items():
        if metric.error_count:
            reasons.append(f"critical_token:{category}")
    return reasons


def _benchmark_summary(items: list[DeviceBenchmarkResponse]) -> DeviceBenchmarkSummaryResponse:
    required_profiles = ["cuda", "apple-silicon", "cpu", "android", "ios"]
    required_minutes = [10, 30, 60]
    latest: dict[tuple[str, int], DeviceBenchmarkResponse] = {}
    for item in sorted(items, key=lambda value: value.recorded_at):
        latest[(item.device_profile, item.sample_minutes)] = item
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
    return DeviceBenchmarkSummaryResponse(
        total_records=len(items),
        ready_records=sum(item.status == "ready" for item in items),
        warning_records=sum(item.status == "warning" for item in items),
        failed_records=sum(item.status == "failed" for item in items),
        coverage=coverage,
        missing_scenarios=missing,
    )


@router.post("/device-benchmarks", response_model=DeviceBenchmarkResponse)
async def record_device_benchmark(
    payload: DeviceBenchmarkRequest,
    request: Request,
) -> DeviceBenchmarkResponse:
    realtime_factor = payload.processing_seconds / payload.audio_duration_seconds
    if not payload.succeeded or payload.failure_count:
        benchmark_status = "failed"
    elif realtime_factor > 1.0 or payload.retry_count or (
        payload.first_audio_ms is not None and payload.first_audio_ms > 5000
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


@router.post("/stt/measure", response_model=SttMeasurementResponse)
async def measure_stt(payload: SttMeasurementRequest) -> SttMeasurementResponse:
    return _measure(payload)


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
async def transcribe_and_measure(
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
    return _measure(SttMeasurementRequest(
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
        measurement = _measure(SttMeasurementRequest(
            reference_text=segment.reference_text,
            transcript_text=transcript,
            engine_id=probe.engine_id,
            model_id=adapter.model_name,
            device_profile=adapter.device,
            audio_duration_seconds=duration,
            processing_seconds=elapsed,
        ))
        reasons = _regeneration_reasons(
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
