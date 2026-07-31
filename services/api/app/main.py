from contextlib import asynccontextmanager
from uuid import uuid4

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from app.api.router import api_router
from app.core.config import get_settings
from app.engines.mock_tts import MockTtsEngine
from app.engines.registry import engine_registry


@asynccontextmanager
async def lifespan(_: FastAPI):
    settings = get_settings()
    if settings.allow_mock_engine:
        engine_registry.register_tts(MockTtsEngine())
    yield
    engine_registry.clear()


settings = get_settings()
app = FastAPI(
    title="SoriON AI API",
    description="교체 가능한 AI 음성 엔진 게이트웨이",
    version="0.1.0",
    lifespan=lifespan,
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)


@app.middleware("http")
async def add_request_id(request: Request, call_next):
    request_id = request.headers.get("X-Request-ID", str(uuid4()))
    response = await call_next(request)
    response.headers["X-Request-ID"] = request_id
    return response


app.include_router(api_router, prefix="/api/v1")
