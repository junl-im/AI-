from typing import Literal

from pydantic import BaseModel, Field

SetupStatus = Literal["ready", "warning", "missing"]
VoicePresetStatus = Literal["ready", "warning", "missing", "blocked"]


class SetupStep(BaseModel):
    id: str
    label: str
    status: SetupStatus
    required: bool
    detail: str
    action: str | None = None


class VoicePresetDiagnostic(BaseModel):
    voice_id: str
    filename: str
    status: VoicePresetStatus
    usable: bool
    duration_seconds: float | None = None
    sample_rate: int | None = None
    channel_count: int | None = None
    sample_width_bits: int | None = None
    silence_ratio: float | None = None
    clipping_ratio: float | None = None
    issues: list[str]


class SetupStatusResponse(BaseModel):
    version: str
    ready: bool
    real_engine_count: int
    voice_preset_ready_count: int = 0
    voice_preset_expected_count: int = 3
    voice_preset_diagnostics: list[VoicePresetDiagnostic] = Field(default_factory=list)
    steps: list[SetupStep]
