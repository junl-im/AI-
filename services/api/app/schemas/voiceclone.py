from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

VoiceClonePurpose = Literal["personal", "content", "accessibility"]
VoiceCloneProfileStatus = Literal[
    "sample-ready",
    "engine-ready",
    "engine-unavailable",
]
VoiceCloneJobStatus = Literal[
    "queued",
    "running",
    "completed",
    "failed",
    "cancelled",
]
VoiceCloneSegmentStatus = Literal[
    "queued",
    "running",
    "completed",
    "failed",
    "cancelled",
]


class VoiceCloneConsent(BaseModel):
    rights_confirmed: bool
    disclosure_confirmed: bool
    prohibited_use_confirmed: bool
    consented_at: datetime
    allowed_purpose: VoiceClonePurpose


class VoiceCloneClientAnalysis(BaseModel):
    duration_seconds: float = Field(default=0, ge=0, le=600)
    sample_rate: int | None = Field(default=None, ge=8_000, le=384_000)
    channel_count: int | None = Field(default=None, ge=1, le=16)
    rms_db: float | None = Field(default=None, ge=-160, le=20)
    silence_ratio: float | None = Field(default=None, ge=0, le=1)
    clipping_ratio: float | None = Field(default=None, ge=0, le=1)
    status: Literal["good", "warning", "blocked"]
    messages: list[str] = Field(default_factory=list, max_length=12)


class VoiceCloneCapabilityResponse(BaseModel):
    engine_id: str
    engine_name: str
    ready: bool
    reason: str | None = None
    recommended_seconds: int = 25
    max_file_bytes: int
    accepted_extensions: list[str]
    worker_version: str | None = None
    diagnostics: dict[str, object] | None = None


class VoiceCloneProfileResponse(BaseModel):
    id: str
    display_name: str
    status: VoiceCloneProfileStatus
    engine_id: str
    sample_file_name: str
    created_at: str
    message: str
    server_analysis: VoiceCloneClientAnalysis | None = None


class VoiceCloneDeleteResponse(BaseModel):
    id: str
    deleted: bool
    message: str


class VoiceCloneJobCreateRequest(BaseModel):
    text: str = Field(min_length=1, max_length=500)


class VoiceCloneSegmentResponse(BaseModel):
    index: int
    text: str
    status: VoiceCloneSegmentStatus
    progress: int = Field(ge=0, le=100)
    message: str
    error: str | None = None
    audio_url: str | None = None


class VoiceCloneJobResponse(BaseModel):
    id: str
    profile_id: str
    status: VoiceCloneJobStatus
    progress: int = Field(ge=0, le=100)
    phase: str
    message: str
    text: str
    created_at: str
    updated_at: str
    first_audio_ms: int | None = None
    duration_seconds: float | None = None
    audio_url: str | None = None
    events_url: str
    error: str | None = None
    segments: list[VoiceCloneSegmentResponse]


class VoiceCloneWorkerResponse(BaseModel):
    ready: bool
    reason: str
    worker_version: str | None = None
    latency_ms: int | None = None
    diagnostics: dict[str, object] | None = None
