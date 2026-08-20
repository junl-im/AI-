from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field

from app.schemas.engine import EngineMode

Emotion = Literal["neutral", "happy", "calm", "sad", "angry", "commercial"]
OutputFormat = Literal["mp3", "wav", "flac"]
JobStatus = Literal[
    "queued",
    "processing",
    "completed",
    "mock-complete",
    "cancelled",
    "failed",
]
JobPhase = Literal[
    "queued",
    "normalizing",
    "generating",
    "merging",
    "completed",
    "cancelled",
    "failed",
]


class TtsSynthesisRequest(BaseModel):
    text: str = Field(min_length=1, max_length=1000)
    voice_id: str = Field(min_length=1, max_length=100)
    emotion: Emotion = "neutral"
    speed: float = Field(default=1.0, ge=0.5, le=2.0)
    pitch: int = Field(default=0, ge=-12, le=12)
    output_format: OutputFormat = "wav"
    engine_id: str | None = None
    normalize_text: bool = True
    job_id: UUID | None = None


class TtsSynthesisResponse(BaseModel):
    job_id: str
    status: JobStatus
    engine_id: str
    engine_mode: EngineMode
    audio_url: str | None
    estimated_duration_seconds: float
    message: str
    normalized_text: str | None = None
    segment_count: int = 1
    first_audio_ms: int | None = None
    processing_ms: int | None = None
    file_size_bytes: int | None = None
    realtime_factor: float | None = None
    requested_engine_id: str | None = None
    attempted_engine_ids: list[str] = Field(default_factory=list)
    fallback_used: bool = False


class NeuralPreviewRequest(TtsSynthesisRequest):
    expected_preview_cache_key: str = Field(min_length=64, max_length=64)


class NeuralPreviewResponse(BaseModel):
    voice_id: str
    cache_id: str
    cache_hit: bool
    preview_cache_key: str
    text_sha256: str
    style_sha256: str
    audio_sha256: str
    audio_url: str
    engine_id: str
    model_fingerprint: str
    reference_fingerprint: str
    first_audio_ms: int | None = None
    processing_ms: int | None = None
    estimated_duration_seconds: float
    file_size_bytes: int
    generated_at: str
    runtime_certified: bool = True
    message: str


class JobSegmentAudio(BaseModel):
    index: int = Field(ge=1)
    total_segments: int = Field(ge=1)
    filename: str = Field(min_length=1, max_length=255)
    audio_url: str = ""
    engine_id: str
    engine_mode: EngineMode
    estimated_duration_seconds: float = Field(ge=0)
    file_size_bytes: int = Field(ge=0)
    ready_after_ms: int = Field(ge=0)
    ready_at: str


class JobProgressResponse(BaseModel):
    job_id: str
    status: JobStatus
    phase: JobPhase
    progress: int = Field(ge=0, le=100)
    current_segment: int = 0
    total_segments: int = 0
    message: str
    error: str | None = None
    ready_segments: list[JobSegmentAudio] = Field(default_factory=list)
    updated_at: str


class JobCancelResponse(BaseModel):
    job_id: str
    cancelled: bool
    message: str
