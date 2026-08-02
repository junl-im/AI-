from typing import Literal

from pydantic import BaseModel

from app.schemas.engine import EngineInfo

ConnectivityStatus = Literal["ready", "warning", "missing"]


class ConnectivityCheck(BaseModel):
    id: str
    label: str
    status: ConnectivityStatus
    detail: str
    latency_ms: int | None = None


class ConnectivityResponse(BaseModel):
    version: str
    status: ConnectivityStatus
    environment: str
    api_base_path: str
    api_ready: bool
    public_https_ready: bool
    public_api_origin: str | None = None
    tts_ready: bool
    voice_clone_ready: bool
    worker_configured: bool
    worker_healthy: bool
    gpu_ready: bool
    gpu_name: str | None = None
    vram_total_mb: int | None = None
    request_id: str | None = None
    server_time: str
    recommended_recheck_seconds: int
    cors_origins: list[str]
    tts_engines: list[EngineInfo]
    voice_clone_engines: list[EngineInfo]
    checks: list[ConnectivityCheck]
