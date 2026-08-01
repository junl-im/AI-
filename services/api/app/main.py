from contextlib import asynccontextmanager
from uuid import uuid4

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from app.api.router import api_router
from app.core.config import get_settings
from app.engines.mock_tts import MockTtsEngine
from app.engines.registry import engine_registry
from app.engines.tts.melo_tts import MeloTtsEngine
from app.engines.tts.system_tts import SystemTtsEngine
from app.engines.voiceclone.cosyvoice_worker import CosyVoiceCloneEngine
from app.middleware.private_network_cors import PrivateNetworkCORSMiddleware
from app.services.audit_log import AuditLogger
from app.services.engine_orchestrator import EngineOrchestrator
from app.services.job_manager import JobManager
from app.services.rate_limit import FixedWindowRateLimiter
from app.services.sqlite_job_store import SQLiteJobStore
from app.services.tts_pipeline import TtsPipeline
from app.storage.audio_store import AudioStore
from app.storage.voice_clone_store import VoiceCloneStore


def client_key(request: Request) -> str:
    user_id = request.headers.get("X-SoriON-User-ID", "").strip()
    client_id = request.headers.get("X-SoriON-Client-ID", "").strip()
    if user_id:
        return f"user:{user_id[:80]}"
    if client_id:
        return f"client:{client_id[:80]}"
    forwarded = request.headers.get("X-Forwarded-For", "").split(",")[0].strip()
    host = forwarded or (request.client.host if request.client else "unknown")
    return f"ip:{host}"


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    app.state.settings = settings
    app.state.audit_logger = AuditLogger(settings.audit_path)
    store = AudioStore(settings.audio_path, settings.audio_ttl_minutes)
    store.cleanup_expired()
    app.state.audio_store = store
    app.state.rate_limiter = FixedWindowRateLimiter(
        settings.public_rate_limit_per_minute
    )
    clone_store = VoiceCloneStore(
        settings.voice_clone_path,
        settings.voice_clone_ttl_days,
        settings.voice_clone_max_file_bytes,
    )
    clone_store.cleanup_expired()
    app.state.voice_clone_store = clone_store
    app.state.tts_pipeline = TtsPipeline(store, settings.max_segment_chars)
    job_store = SQLiteJobStore(settings.job_store_file)
    app.state.job_manager = JobManager(
        max_concurrent=settings.max_concurrent_generations,
        timeout_seconds=settings.generation_timeout_seconds,
        store=job_store,
        claim_ttl_seconds=settings.job_claim_ttl_seconds,
        result_ttl_seconds=settings.job_result_ttl_minutes * 60,
        history_ttl_seconds=settings.job_history_ttl_hours * 60 * 60,
        poll_interval_seconds=settings.job_poll_interval_seconds,
    )
    cleanup = await app.state.job_manager.initialize()
    if cleanup.expired_results or cleanup.deleted_jobs:
        app.state.audit_logger.write(
            event="job-store-cleanup",
            method="SYSTEM",
            path=str(settings.job_store_file),
            status_code=200,
            request_id="startup",
            actor=(
                f"expired-results:{cleanup.expired_results};"
                f"deleted-jobs:{cleanup.deleted_jobs}"
            ),
        )
    if settings.enable_melo_tts:
        engine_registry.register_tts(MeloTtsEngine(store, settings.melo_device))
    if settings.enable_system_tts:
        engine_registry.register_tts(SystemTtsEngine(store, settings.system_tts_voice))
    if settings.allow_mock_engine:
        engine_registry.register_tts(MockTtsEngine())
    app.state.engine_orchestrator = EngineOrchestrator(
        engine_registry,
        preferred_order=settings.tts_engine_order_list,
        failure_threshold=settings.engine_failure_threshold,
        cooldown_seconds=settings.engine_cooldown_seconds,
    )
    engine_registry.register_voice_clone(
        CosyVoiceCloneEngine(
            settings.cosyvoice_worker_url,
            settings.cosyvoice_worker_timeout_seconds,
            settings.cosyvoice_worker_job_timeout_seconds,
            settings.worker_service_token,
            settings.worker_signature_secret,
        )
    )
    yield
    engine_registry.clear()


settings = get_settings()
app = FastAPI(
    title="SoriON AI API",
    description="교체 가능한 AI 음성 엔진 게이트웨이",
    version="0.8.5",
    lifespan=lifespan,
)
app.add_middleware(
    PrivateNetworkCORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=[
        "X-Request-ID",
        "X-RateLimit-Remaining",
        "X-RateLimit-Reset",
    ],
    max_age=86400,
    allow_private_network=settings.allow_private_network,
)


@app.middleware("http")
async def govern_request(request: Request, call_next):
    request_id = request.headers.get("X-Request-ID", str(uuid4()))
    request.state.request_id = request_id
    actor = client_key(request)
    request.state.actor = actor
    is_api = request.url.path.startswith("/api/v1/")
    exempt = request.url.path.endswith("/health") or request.method == "OPTIONS"
    if is_api and not exempt:
        allowed, remaining, reset = request.app.state.rate_limiter.check(actor)
        if not allowed:
            request.app.state.audit_logger.write(
                event="rate-limit",
                method=request.method,
                path=request.url.path,
                status_code=429,
                request_id=request_id,
                actor=actor,
            )
            return JSONResponse(
                status_code=429,
                content={"detail": "SOA-7001: 요청이 너무 많습니다. 잠시 후 다시 시도하세요."},
                headers={
                    "X-Request-ID": request_id,
                    "X-RateLimit-Remaining": "0",
                    "X-RateLimit-Reset": str(reset),
                },
            )
    else:
        remaining = settings.public_rate_limit_per_minute
        reset = 0
    response = await call_next(request)
    response.headers["X-Request-ID"] = request_id
    if is_api:
        response.headers["X-RateLimit-Remaining"] = str(remaining)
        response.headers["X-RateLimit-Reset"] = str(reset)
    if request.method in {"POST", "DELETE"}:
        request.app.state.audit_logger.write(
            event="api-mutation",
            method=request.method,
            path=request.url.path,
            status_code=response.status_code,
            request_id=request_id,
            actor=actor,
        )
    return response


app.include_router(api_router, prefix="/api/v1")
