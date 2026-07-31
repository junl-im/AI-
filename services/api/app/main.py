from contextlib import asynccontextmanager
from uuid import uuid4

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from app.api.router import api_router
from app.core.config import get_settings
from app.engines.mock_tts import MockTtsEngine
from app.engines.registry import engine_registry
from app.engines.tts.melo_tts import MeloTtsEngine
from app.engines.tts.system_tts import SystemTtsEngine
from app.engines.voiceclone.cosyvoice_worker import CosyVoiceCloneEngine
from app.services.job_manager import JobManager
from app.services.tts_pipeline import TtsPipeline
from app.storage.audio_store import AudioStore
from app.storage.voice_clone_store import VoiceCloneStore


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    store = AudioStore(settings.audio_path, settings.audio_ttl_minutes)
    store.cleanup_expired()
    app.state.audio_store = store
    app.state.settings = settings
    clone_store = VoiceCloneStore(
        settings.voice_clone_path,
        settings.voice_clone_ttl_days,
        settings.voice_clone_max_file_bytes,
    )
    clone_store.cleanup_expired()
    app.state.voice_clone_store = clone_store
    app.state.tts_pipeline = TtsPipeline(store, settings.max_segment_chars)
    app.state.job_manager = JobManager(
        max_concurrent=settings.max_concurrent_generations,
        timeout_seconds=settings.generation_timeout_seconds,
    )
    if settings.enable_melo_tts:
        engine_registry.register_tts(MeloTtsEngine(store, settings.melo_device))
    if settings.enable_system_tts:
        engine_registry.register_tts(SystemTtsEngine(store, settings.system_tts_voice))
    if settings.allow_mock_engine:
        engine_registry.register_tts(MockTtsEngine())
    engine_registry.register_voice_clone(
        CosyVoiceCloneEngine(
            settings.cosyvoice_worker_url,
            settings.cosyvoice_worker_timeout_seconds,
        )
    )
    yield
    engine_registry.clear()


settings = get_settings()
app = FastAPI(
    title="SoriON AI API",
    description="교체 가능한 AI 음성 엔진 게이트웨이",
    version="0.6.2",
    lifespan=lifespan,
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)


@app.middleware("http")
async def add_request_id(request: Request, call_next):
    request_id = request.headers.get("X-Request-ID", str(uuid4()))
    response = await call_next(request)
    response.headers["X-Request-ID"] = request_id
    return response


app.include_router(api_router, prefix="/api/v1")
