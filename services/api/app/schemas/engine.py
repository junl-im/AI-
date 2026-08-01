from typing import Literal

from pydantic import BaseModel, Field

EngineMode = Literal["mock", "local", "ai"]
EngineHealth = Literal["ready", "cooldown", "unavailable"]
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
    long_form: bool = False
    streaming: bool = False
    recommended: bool = False
    health: EngineHealth = "unavailable"
    success_count: int = 0
    failure_count: int = 0
    consecutive_failures: int = 0
    cooldown_remaining_seconds: float = 0
    last_error: str | None = None
