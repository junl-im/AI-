from pydantic import BaseModel, Field

from app.schemas.engine import (
    EngineHealth,
    EngineMode,
    EngineQualityTier,
)
from app.schemas.tts import Emotion


class DiagnosticCheck(BaseModel):
    id: str
    label: str
    status: str
    detail: str


class EngineDiagnostic(BaseModel):
    engine_id: str
    name: str
    mode: EngineMode
    ready: bool
    provider: str
    quality_tier: EngineQualityTier = "basic"
    auto_eligible: bool = True
    korean_specialization: int = Field(default=0, ge=0, le=100)
    long_form: bool = False
    streaming: bool = False
    model_loaded: bool | None = None
    recommended: bool = False
    health: EngineHealth = "unavailable"
    success_count: int = 0
    failure_count: int = 0
    cooldown_remaining_seconds: float = 0
    checks: list[DiagnosticCheck]


class QualityDiagnosticsResponse(BaseModel):
    version: str
    python_version: str
    platform: str
    process_id: int
    memory_mb: float | None
    open_file_descriptors: int | None = None
    engines: list[EngineDiagnostic]


class TextPreviewRequest(BaseModel):
    text: str = Field(min_length=1, max_length=5000)
    max_chars: int = Field(default=180, ge=40, le=500)


class TextPreviewResponse(BaseModel):
    original_text: str
    normalized_text: str
    changes: list[str]
    segments: list[str]
    segment_count: int


class EvaluationSentence(BaseModel):
    id: str
    category: str
    text: str
    focus: list[str]


class QualityCompareRequest(BaseModel):
    text: str = Field(min_length=1, max_length=3000)
    engine_ids: list[str] = Field(min_length=1, max_length=2)
    voice_id: str = Field(default="sori-warm", min_length=1, max_length=100)
    emotion: Emotion = "neutral"
    speed: float = Field(default=1.0, ge=0.5, le=2.0)
    pitch: int = Field(default=0, ge=-12, le=12)


class QualityResult(BaseModel):
    engine_id: str
    engine_name: str
    engine_mode: EngineMode
    status: str
    audio_url: str | None
    message: str
    elapsed_ms: int | None = None
    duration_seconds: float | None = None
    realtime_factor: float | None = None
    file_size_bytes: int | None = None
    segment_count: int = 1


class QualityCompareResponse(BaseModel):
    normalized_text: str
    changes: list[str]
    results: list[QualityResult]
