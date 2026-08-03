import asyncio
import hashlib
import time
from collections.abc import AsyncIterator
from pathlib import Path
from urllib.parse import urlparse
from uuid import uuid4

from fastapi import APIRouter, HTTPException, Query, Request, status
from fastapi.responses import FileResponse, StreamingResponse

from app.core.config import get_settings
from app.schemas.tts import (
    JobCancelResponse,
    JobProgressResponse,
    JobSegmentAudio,
    TtsSynthesisRequest,
    TtsSynthesisResponse,
)
from app.services.engine_orchestrator import (
    EngineExhaustedError,
    EngineUnavailableError,
)
from app.services.job_manager import (
    GenerationTimeoutError,
    JobConflictError,
    JobResultExpiredError,
)
from app.services.proxy_headers import effective_origin
from app.services.segment_audio import SegmentAudioSigner

router = APIRouter()


def _with_segment_urls(
    snapshot: JobProgressResponse,
    signer: SegmentAudioSigner,
) -> JobProgressResponse:
    return snapshot.model_copy(
        update={
            "ready_segments": [
                segment.model_copy(
                    update={
                        "audio_url": signer.issue(
                            snapshot.job_id,
                            segment.index,
                            segment.filename,
                        )
                    }
                )
                for segment in snapshot.ready_segments
            ]
        }
    )


def _absolute_audio_url(request: Request, value: str | None) -> str | None:
    if not value or not value.startswith("/"):
        return value
    settings = request.app.state.settings
    origin = effective_origin(request, settings.trusted_proxy_cidr_list).origin
    return f"{origin.rstrip('/')}{value}"


def _signed_final_result(
    request: Request,
    result: TtsSynthesisResponse,
) -> TtsSynthesisResponse:
    if not result.audio_url:
        return result
    filename = Path(urlparse(result.audio_url).path).name
    if not filename or request.app.state.audio_store.resolve(filename) is None:
        return result.model_copy(update={"audio_url": None})
    signed = request.app.state.segment_audio_signer.issue_final(
        result.job_id,
        filename,
    )
    return result.model_copy(update={"audio_url": _absolute_audio_url(request, signed)})


@router.post("/synthesize", response_model=TtsSynthesisResponse)
async def synthesize(payload: TtsSynthesisRequest, request: Request) -> TtsSynthesisResponse:
    settings = get_settings()
    preferred_engine = payload.engine_id or settings.default_tts_engine
    job_id = str(payload.job_id or uuid4())
    normalized = payload.model_copy(
        update={"job_id": job_id, "engine_id": preferred_engine}
    )
    request_key = hashlib.sha256(
        normalized.model_dump_json(exclude={"job_id"}).encode("utf-8")
    ).hexdigest()
    manager = request.app.state.job_manager
    pipeline = request.app.state.tts_pipeline

    async def report(phase, progress, current_segment, total_segments, message) -> None:
        await manager.update(
            job_id,
            status="processing",
            phase=phase,
            progress=progress,
            current_segment=current_segment,
            total_segments=total_segments,
            message=message,
        )

    async def report_segment(segment: JobSegmentAudio) -> None:
        await manager.update(
            job_id,
            status="processing",
            phase="generating",
            current_segment=segment.index,
            total_segments=segment.total_segments,
            message=(
                f"{segment.total_segments}개 중 {segment.index}번째 구간 음원을 "
                "재생할 수 있습니다."
            ),
            ready_segment=segment,
        )

    try:
        result = await manager.run(
            job_id,
            lambda: request.app.state.engine_orchestrator.synthesize(
                normalized,
                lambda engine, engine_request: pipeline.synthesize(
                    engine,
                    engine_request,
                    report,
                    report_segment,
                ),
            ),
            request_key=request_key,
        )
    except JobConflictError as error:
        request.app.state.audit_logger.write(
            event="tts-job-conflict",
            method=request.method,
            path=request.url.path,
            status_code=status.HTTP_409_CONFLICT,
            request_id=request.state.request_id,
            actor=request.state.actor,
        )
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="SOA-4009: 같은 작업 ID를 다른 음성 요청에 재사용할 수 없습니다.",
        ) from error
    except JobResultExpiredError as error:
        request.app.state.audit_logger.write(
            event="tts-job-result-expired",
            method=request.method,
            path=request.url.path,
            status_code=status.HTTP_410_GONE,
            request_id=request.state.request_id,
            actor=request.state.actor,
        )
        raise HTTPException(
            status_code=status.HTTP_410_GONE,
            detail="SOA-4012: 완료 결과가 만료됐습니다. 새 작업 ID로 다시 생성해 주세요.",
        ) from error
    except EngineUnavailableError as error:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"SOA-4001: {error}",
        ) from error
    except EngineExhaustedError as error:
        request.app.state.audit_logger.write(
            event="tts-engine-fallback-exhausted",
            method=request.method,
            path=request.url.path,
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            request_id=request.state.request_id,
            actor=";".join(error.attempts),
        )
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="SOA-4013: 자동 엔진 전환을 모두 시도했지만 생성하지 못했습니다.",
        ) from error
    except GenerationTimeoutError as error:
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail="SOA-4008: 음성 생성 시간이 초과되었습니다.",
        ) from error
    except asyncio.CancelledError as error:
        raise HTTPException(
            status_code=499,
            detail="SOA-4007: 사용자가 음성 생성을 취소했습니다.",
        ) from error
    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(error),
        ) from error
    except RuntimeError as error:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"SOA-4002: {error}",
        ) from error

    return _signed_final_result(request, result)


@router.get("/jobs/{job_id}", response_model=JobProgressResponse)
async def get_job(job_id: str, request: Request) -> JobProgressResponse:
    snapshot = await request.app.state.job_manager.get(job_id)
    if snapshot is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="SOA-4010: 작업 상태를 찾지 못했습니다.",
        )
    return _with_segment_urls(snapshot, request.app.state.segment_audio_signer)


@router.get("/jobs/{job_id}/events")
async def stream_job_events(job_id: str, request: Request) -> StreamingResponse:
    manager = request.app.state.job_manager
    signer = request.app.state.segment_audio_signer
    interval = max(0.1, request.app.state.settings.job_poll_interval_seconds)

    async def events() -> AsyncIterator[str]:
        last_payload = ""
        seen_segments: set[int] = set()
        missing_checks = 0
        while True:
            if await request.is_disconnected():
                return
            snapshot = await manager.get(job_id)
            if snapshot is None:
                missing_checks += 1
                if missing_checks >= 40:
                    yield (
                        'event: error\n'
                        'data: {"code":"SOA-4010","message":"작업 상태를 찾지 못했습니다."}\n\n'
                    )
                    return
            else:
                missing_checks = 0
                public_snapshot = _with_segment_urls(snapshot, signer)
                for segment in public_snapshot.ready_segments:
                    if segment.index in seen_segments:
                        continue
                    yield (
                        f"id: segment-{segment.index}\n"
                        f"event: segment-ready\n"
                        f"data: {segment.model_dump_json()}\n\n"
                    )
                    seen_segments.add(segment.index)
                snapshot_payload = snapshot.model_dump_json()
                if snapshot_payload != last_payload:
                    yield (
                        "event: progress\n"
                        f"data: {public_snapshot.model_dump_json()}\n\n"
                    )
                    last_payload = snapshot_payload
                if snapshot.phase in {"completed", "failed", "cancelled"}:
                    return
            await asyncio.sleep(interval)

    return StreamingResponse(
        events(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache, no-transform",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.get("/jobs/{job_id}/segments/{index}/audio")
async def get_segment_audio(
    job_id: str,
    index: int,
    request: Request,
    filename: str = Query(alias="file", min_length=1, max_length=255),
    expires: int = Query(gt=0),
    signature: str = Query(min_length=64, max_length=64),
) -> FileResponse:
    if expires < int(time.time()):
        raise HTTPException(
            status_code=status.HTTP_410_GONE,
            detail="SOA-4015: 구간 음원 주소가 만료됐습니다. 작업 상태를 다시 조회해 주세요.",
        )
    signer = request.app.state.segment_audio_signer
    if not signer.verify(job_id, index, filename, expires, signature):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="SOA-4014: 구간 음원 주소 서명을 확인할 수 없습니다.",
        )
    snapshot = await request.app.state.job_manager.get(job_id)
    segment = next(
        (
            item
            for item in snapshot.ready_segments
            if item.index == index and item.filename == filename
        ),
        None,
    ) if snapshot is not None else None
    if segment is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="SOA-4016: 해당 작업의 준비된 구간 음원을 찾지 못했습니다.",
        )
    store = request.app.state.audio_store
    store.cleanup_expired()
    path = store.resolve(filename)
    if path is None:
        raise HTTPException(
            status_code=status.HTTP_410_GONE,
            detail="SOA-4017: 구간 음원 보관 시간이 만료됐습니다.",
        )
    return FileResponse(
        path,
        media_type="audio/wav",
        filename=f"segment-{index}.wav",
        content_disposition_type="inline",
        headers={
            "Cache-Control": "private, no-store, max-age=0",
            "X-SoriON-Segment-Index": str(index),
            "X-SoriON-Segment-Total": str(segment.total_segments),
            "Referrer-Policy": "no-referrer",
            "X-Content-Type-Options": "nosniff",
        },
    )


@router.get("/jobs/{job_id}/audio")
async def get_final_audio(
    job_id: str,
    request: Request,
    filename: str = Query(alias="file", min_length=1, max_length=255),
    expires: int = Query(gt=0),
    signature: str = Query(min_length=64, max_length=64),
) -> FileResponse:
    if expires < int(time.time()):
        raise HTTPException(
            status_code=status.HTTP_410_GONE,
            detail="SOA-4018: 최종 음원 주소가 만료됐습니다. 작업 결과를 다시 조회해 주세요.",
        )
    signer = request.app.state.segment_audio_signer
    if not signer.verify_final(job_id, filename, expires, signature):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="SOA-4019: 최종 음원 주소 서명을 확인할 수 없습니다.",
        )
    result = await request.app.state.job_manager.get_result(job_id)
    result_filename = (
        Path(urlparse(result.audio_url).path).name
        if isinstance(result, TtsSynthesisResponse) and result.audio_url
        else None
    )
    if result_filename != filename:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="SOA-4020: 해당 작업의 최종 음원을 찾지 못했습니다.",
        )
    store = request.app.state.audio_store
    store.cleanup_expired()
    path = store.resolve(filename)
    if path is None:
        raise HTTPException(
            status_code=status.HTTP_410_GONE,
            detail="SOA-4021: 최종 음원 보관 시간이 만료됐습니다.",
        )
    media_types = {".wav": "audio/wav", ".mp3": "audio/mpeg", ".flac": "audio/flac"}
    return FileResponse(
        path,
        media_type=media_types.get(path.suffix.lower(), "application/octet-stream"),
        filename=path.name,
        content_disposition_type="inline",
        headers={
            "Cache-Control": "private, no-store, max-age=0",
            "Referrer-Policy": "no-referrer",
            "X-Content-Type-Options": "nosniff",
            "X-SoriON-Audio-Rehydratable": "true",
        },
    )


@router.get("/jobs/{job_id}/result", response_model=TtsSynthesisResponse)
async def get_job_result(job_id: str, request: Request) -> TtsSynthesisResponse:
    manager = request.app.state.job_manager
    snapshot = await manager.get(job_id)
    if snapshot is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="SOA-4010: 작업 상태를 찾지 못했습니다.",
        )
    if snapshot.phase != "completed":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"SOA-4011: 작업이 아직 완료되지 않았습니다. 현재 단계: {snapshot.phase}",
        )
    result = await manager.get_result(job_id)
    if not isinstance(result, TtsSynthesisResponse):
        raise HTTPException(
            status_code=status.HTTP_410_GONE,
            detail="SOA-4012: 완료 결과가 만료됐습니다. 다시 생성해 주세요.",
        )
    return _signed_final_result(request, result)


@router.delete("/jobs/{job_id}", response_model=JobCancelResponse)
async def cancel_job(job_id: str, request: Request) -> JobCancelResponse:
    cancelled = await request.app.state.job_manager.cancel(job_id)
    return JobCancelResponse(
        job_id=job_id,
        cancelled=cancelled,
        message="생성 취소를 요청했습니다." if cancelled else "실행 중인 작업을 찾지 못했습니다.",
    )
