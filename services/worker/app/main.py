import asyncio
import json
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Annotated
from uuid import UUID, uuid4

from fastapi import FastAPI, File, Form, HTTPException, Request, UploadFile, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse, StreamingResponse

from app.audit import WorkerAuditLogger
from app.config import WorkerSettings, get_settings
from app.jobs import TERMINAL_STATUSES, WorkerJobManager
from app.rate_limit import FixedWindowRateLimiter
from app.runtime import CosyVoiceRuntime
from app.schemas import (
    HealthResponse,
    ReadinessResponse,
    WorkerDiagnosticsResponse,
    WorkerJobResponse,
)
from app.security import verify_worker_request


async def save_sample(sample: UploadFile, destination: Path, max_bytes: int) -> None:
    total = 0
    destination.parent.mkdir(parents=True, exist_ok=True)
    try:
        with destination.open("wb") as output:
            while chunk := await sample.read(1024 * 1024):
                total += len(chunk)
                if total > max_bytes:
                    raise HTTPException(
                        status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                        detail="SOA-W1002: Worker 음성 샘플 제한을 초과했습니다.",
                    )
                output.write(chunk)
    except Exception:
        destination.unlink(missing_ok=True)
        raise
    if total == 0:
        destination.unlink(missing_ok=True)
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="SOA-W1001: 비어 있는 음성 샘플은 사용할 수 없습니다.",
        )


def protected_path(path: str) -> bool:
    return path == "/ready" or path.startswith("/v1/")


def create_app(
    settings: WorkerSettings | None = None,
    runtime: CosyVoiceRuntime | None = None,
) -> FastAPI:
    worker_settings = settings or get_settings()

    @asynccontextmanager
    async def lifespan(app: FastAPI):
        output_root = worker_settings.output_path
        output_root.mkdir(parents=True, exist_ok=True)
        current_runtime = runtime or CosyVoiceRuntime(worker_settings)
        app.state.settings = worker_settings
        app.state.runtime = current_runtime
        app.state.audit = WorkerAuditLogger(worker_settings.resolved_audit_path)
        app.state.rate_limiter = FixedWindowRateLimiter(
            worker_settings.rate_limit_per_minute
        )
        app.state.job_manager = WorkerJobManager(
            current_runtime,
            output_root / "jobs",
            worker_settings.max_concurrent_jobs,
            worker_settings.job_ttl_minutes,
        )
        yield

    app = FastAPI(
        title="SoriON CosyVoice Worker",
        version="0.8.5",
        description="인증·감사·TTL을 포함한 CosyVoice 음성 복제 실행 서비스",
        lifespan=lifespan,
    )
    app.add_middleware(
        CORSMiddleware,
        allow_origins=worker_settings.cors_origin_list,
        allow_credentials=False,
        allow_methods=["GET", "POST", "OPTIONS"],
        allow_headers=["*"],
    )

    @app.middleware("http")
    async def protect_worker(request: Request, call_next):
        if request.method == "OPTIONS" or not protected_path(request.url.path):
            return await call_next(request)
        body = await request.body()
        result = verify_worker_request(
            request.method,
            request.url.path,
            request.headers,
            body,
            worker_settings.service_token,
            worker_settings.signature_secret,
            worker_settings.auth_ttl_seconds,
        )
        actor = request.headers.get("X-SoriON-Service-Token", "anonymous")[:12]
        if not result.ok:
            request.app.state.audit.write("auth-failed", request.url.path, 401, actor)
            return JSONResponse(status_code=401, content={"detail": result.reason})
        allowed, remaining, reset = request.app.state.rate_limiter.check(actor)
        if not allowed:
            request.app.state.audit.write("rate-limit", request.url.path, 429, actor)
            return JSONResponse(
                status_code=429,
                content={"detail": "SOA-W7006: Worker 요청 제한을 초과했습니다."},
                headers={"X-RateLimit-Reset": str(reset)},
            )
        response = await call_next(request)
        response.headers["X-RateLimit-Remaining"] = str(remaining)
        if request.method == "POST":
            request.app.state.audit.write(
                "worker-mutation",
                request.url.path,
                response.status_code,
                actor,
            )
        return response

    @app.get("/health", response_model=HealthResponse)
    def health() -> HealthResponse:
        return HealthResponse()

    @app.get("/ready", response_model=ReadinessResponse)
    def ready(request: Request) -> ReadinessResponse:
        diagnostics = request.app.state.runtime.diagnostics()
        return ReadinessResponse(
            status="ready" if diagnostics.ready else "not-ready",
            diagnostics=WorkerDiagnosticsResponse(**diagnostics.as_dict()),
        )

    @app.get("/v1/diagnostics", response_model=WorkerDiagnosticsResponse)
    def diagnostics(request: Request) -> WorkerDiagnosticsResponse:
        snapshot = request.app.state.runtime.diagnostics()
        return WorkerDiagnosticsResponse(**snapshot.as_dict())

    @app.post(
        "/v1/jobs",
        response_model=WorkerJobResponse,
        status_code=status.HTTP_202_ACCEPTED,
    )
    async def create_job(
        request: Request,
        sample: Annotated[UploadFile, File()],
        profile_id: Annotated[str, Form(min_length=1, max_length=80)],
        text: Annotated[str, Form(min_length=1, max_length=500)],
    ) -> WorkerJobResponse:
        diagnostics = request.app.state.runtime.diagnostics()
        if not diagnostics.ready:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"SOA-W2001: {diagnostics.reason}",
            )
        extension = Path(sample.filename or "sample.wav").suffix.lower() or ".wav"
        sample_path = request.app.state.settings.output_path / "inputs" / (
            f"{uuid4()}{extension}"
        )
        await save_sample(sample, sample_path, request.app.state.settings.max_sample_bytes)
        job = request.app.state.job_manager.create(profile_id, text.strip(), sample_path)
        return WorkerJobResponse(**job.snapshot())

    @app.get("/v1/jobs/{job_id}", response_model=WorkerJobResponse)
    def get_job(job_id: UUID, request: Request) -> WorkerJobResponse:
        job = request.app.state.job_manager.get(job_id)
        if job is None:
            raise HTTPException(status_code=404, detail="SOA-W2004: 작업을 찾지 못했습니다.")
        return WorkerJobResponse(**job.snapshot())

    @app.post("/v1/jobs/{job_id}/cancel", response_model=WorkerJobResponse)
    async def cancel_job(job_id: UUID, request: Request) -> WorkerJobResponse:
        job = await request.app.state.job_manager.cancel(job_id)
        if job is None:
            raise HTTPException(status_code=404, detail="SOA-W2004: 작업을 찾지 못했습니다.")
        return WorkerJobResponse(**job.snapshot())

    @app.post("/v1/jobs/{job_id}/retry", response_model=WorkerJobResponse)
    async def retry_job(job_id: UUID, request: Request) -> WorkerJobResponse:
        job = request.app.state.job_manager.retry(job_id)
        if job is None:
            raise HTTPException(status_code=404, detail="SOA-W2004: 작업을 찾지 못했습니다.")
        return WorkerJobResponse(**job.snapshot())

    @app.get("/v1/jobs/{job_id}/events")
    async def job_events(job_id: UUID, request: Request) -> StreamingResponse:
        job = request.app.state.job_manager.get(job_id)
        if job is None:
            raise HTTPException(status_code=404, detail="SOA-W2004: 작업을 찾지 못했습니다.")
        header = request.headers.get("Last-Event-ID", "-1")
        try:
            initial_revision = int(header)
        except ValueError:
            initial_revision = -1

        async def stream():
            last_revision = initial_revision
            while True:
                current = request.app.state.job_manager.get(job_id)
                if current is None:
                    break
                if current.revision > last_revision:
                    payload = json.dumps(current.snapshot(), ensure_ascii=False)
                    yield f"id: {current.revision}\nevent: progress\ndata: {payload}\n\n"
                    last_revision = current.revision
                if current.status in TERMINAL_STATUSES:
                    break
                if await request.is_disconnected():
                    break
                await asyncio.sleep(0.25)

        return StreamingResponse(
            stream(),
            media_type="text/event-stream",
            headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
        )

    @app.get("/v1/jobs/{job_id}/audio")
    def job_audio(job_id: UUID, request: Request) -> FileResponse:
        job = request.app.state.job_manager.get(job_id)
        if job is None:
            raise HTTPException(status_code=404, detail="SOA-W2004: 작업을 찾지 못했습니다.")
        if job.status != "completed" or not job.output_path.exists():
            raise HTTPException(status_code=409, detail="SOA-W2005: 완성된 음원이 없습니다.")
        return FileResponse(
            job.output_path,
            media_type="audio/wav",
            filename=f"sorion-clone-{job.id}.wav",
        )

    @app.get("/v1/jobs/{job_id}/segments/{segment_index}/audio")
    def segment_audio(
        job_id: UUID,
        segment_index: int,
        request: Request,
    ) -> FileResponse:
        job = request.app.state.job_manager.get(job_id)
        if job is None:
            raise HTTPException(status_code=404, detail="SOA-W2004: 작업을 찾지 못했습니다.")
        segment = next(
            (item for item in job.segments if item.index == segment_index),
            None,
        )
        missing = segment is None or segment.status != "completed"
        if missing or not segment.output_path.exists():
            raise HTTPException(status_code=409, detail="SOA-W2006: 완성된 구간 음원이 없습니다.")
        return FileResponse(
            segment.output_path,
            media_type="audio/wav",
            filename=f"sorion-clone-{job.id}-{segment_index}.wav",
        )

    return app


app = create_app()
