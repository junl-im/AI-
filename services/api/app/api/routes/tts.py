import asyncio
from uuid import uuid4

from fastapi import APIRouter, HTTPException, Request, status

from app.core.config import get_settings
from app.engines.registry import engine_registry
from app.schemas.tts import (
    JobCancelResponse,
    JobProgressResponse,
    TtsSynthesisRequest,
    TtsSynthesisResponse,
)
from app.services.job_manager import GenerationTimeoutError, JobAlreadyRunningError

router = APIRouter()


@router.post("/synthesize", response_model=TtsSynthesisResponse)
async def synthesize(payload: TtsSynthesisRequest, request: Request) -> TtsSynthesisResponse:
    settings = get_settings()
    engine = engine_registry.resolve_tts(payload.engine_id or settings.default_tts_engine)
    if engine is None or not engine.info().ready:
        engine_id = payload.engine_id or settings.default_tts_engine
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"SOA-4001: '{engine_id}' 음성 엔진을 사용할 수 없습니다.",
        )

    job_id = str(payload.job_id or uuid4())
    normalized = payload.model_copy(update={"job_id": job_id})
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

    try:
        result = await manager.run(
            job_id,
            lambda: pipeline.synthesize(engine, normalized, report),
        )
    except JobAlreadyRunningError as error:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="SOA-4009: 같은 작업 ID가 이미 실행 중입니다.",
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

    if result.audio_url and result.audio_url.startswith("/"):
        result.audio_url = f"{str(request.base_url).rstrip('/')}{result.audio_url}"
    return result


@router.get("/jobs/{job_id}", response_model=JobProgressResponse)
async def get_job(job_id: str, request: Request) -> JobProgressResponse:
    snapshot = await request.app.state.job_manager.get(job_id)
    if snapshot is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="SOA-4010: 작업 상태를 찾지 못했습니다.",
        )
    return snapshot


@router.delete("/jobs/{job_id}", response_model=JobCancelResponse)
async def cancel_job(job_id: str, request: Request) -> JobCancelResponse:
    cancelled = await request.app.state.job_manager.cancel(job_id)
    return JobCancelResponse(
        job_id=job_id,
        cancelled=cancelled,
        message="생성 취소를 요청했습니다." if cancelled else "실행 중인 작업을 찾지 못했습니다.",
    )
