from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field

from app.schemas.engine import EngineMode

Emotion = Literal["neutral", "happy", "calm", "sad", "angry", "commercial"]
OutputFormat = Literal["mp3", "wav", "flac"]
JobStatus = Literal["queued", "processing", "completed", "mock-complete", "cancelled"]


class TtsSynthesisRequest(BaseModel):
    text: str = Field(min_length=1, max_length=1000)
    voice_id: str = Field(min_length=1, max_length=100)
    emotion: Emotion = "neutral"
    speed: float = Field(default=1.0, ge=0.5, le=2.0)
    pitch: int = Field(default=0, ge=-12, le=12)
    output_format: OutputFormat = "wav"
    engine_id: str | None = None
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
    processing_ms: int | None = None
    file_size_bytes: int | None = None
    realtime_factor: float | None = None


class JobCancelResponse(BaseModel):
    job_id: str
    cancelled: bool
    message: str
    normalized_text: str | None = None
    segment_count: int = 1
    processing_ms: int | None = None
    file_size_bytes: int | None = None
    realtime_factor: float | None = None
