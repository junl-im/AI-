from typing import Literal

from pydantic import BaseModel, Field

EngineMode = Literal["mock", "local", "ai"]
EngineHealth = Literal["ready", "probing", "cooldown", "unavailable"]
EngineQualityTier = Literal["basic", "standard", "premium", "reference"]


class EngineInfo(BaseModel):
    id: str
    name: str
    kind: str
    mode: EngineMode
    provider: str
    languages: list[str]
    output_formats: list[str]
    supports_emotion: bool
    supports_speed: bool = True
    supports_pitch: bool = False
    supports_voice_clone: bool
    ready: bool
    reason: str | None = None
    quality_tier: EngineQualityTier = "basic"
    korean_specialization: int = Field(default=0, ge=0, le=100)
    auto_eligible: bool = True
    long_form: bool = False
    streaming: bool = False
    recommended: bool = False
    health: EngineHealth = "unavailable"
    success_count: int = 0
    failure_count: int = 0
    attempt_count: int = 0
    success_rate: float | None = Field(default=None, ge=0, le=1)
    consecutive_failures: int = 0
    cooldown_remaining_seconds: float = 0
    last_error: str | None = None
    circuit_open_count: int = 0
    probe_in_flight: bool = False
    average_latency_ms: float | None = Field(default=None, ge=0)
    last_latency_ms: float | None = Field(default=None, ge=0)
    last_success_at: str | None = None
    last_failure_at: str | None = None


class EngineRuntimeResetResponse(BaseModel):
    engine_id: str
    cleared: bool
    message: str
    engine: EngineInfo
