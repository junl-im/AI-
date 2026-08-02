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
    SttMeasurementRequest,
    SttMeasurementResponse,
    SttProbeResponse,
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
