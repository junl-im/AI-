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
    cors_origins: list[str]
    tts_engines: list[EngineInfo]
    voice_clone_engines: list[EngineInfo]
    checks: list[ConnectivityCheck]
