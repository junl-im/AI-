from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

VoiceClonePurpose = Literal["personal", "content", "accessibility"]
VoiceCloneProfileStatus = Literal["sample-ready", "engine-ready", "engine-unavailable"]


class VoiceCloneConsent(BaseModel):
    rights_confirmed: bool
    disclosure_confirmed: bool
    prohibited_use_confirmed: bool
    consented_at: datetime
    allowed_purpose: VoiceClonePurpose


class VoiceCloneCapabilityResponse(BaseModel):
    engine_id: str
    engine_name: str
    ready: bool
    reason: str | None = None
    recommended_seconds: int = 10
    max_file_bytes: int
    accepted_extensions: list[str]


class VoiceCloneProfileResponse(BaseModel):
    id: str
    display_name: str
    status: VoiceCloneProfileStatus
    engine_id: str
    sample_file_name: str
    created_at: str
    message: str


class VoiceCloneDeleteResponse(BaseModel):
    id: str
    deleted: bool
    message: str


class VoiceCloneClientAnalysis(BaseModel):
    duration_seconds: float = Field(default=0, ge=0, le=600)
    sample_rate: int | None = Field(default=None, ge=8_000, le=384_000)
    channel_count: int | None = Field(default=None, ge=1, le=16)
    rms_db: float | None = Field(default=None, ge=-160, le=20)
    silence_ratio: float | None = Field(default=None, ge=0, le=1)
    clipping_ratio: float | None = Field(default=None, ge=0, le=1)
    status: Literal["good", "warning", "blocked"]
    messages: list[str] = Field(default_factory=list, max_length=12)
