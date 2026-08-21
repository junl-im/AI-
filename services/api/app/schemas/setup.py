from typing import Literal

from pydantic import BaseModel, Field

SetupStatus = Literal["ready", "warning", "missing"]
VoicePresetStatus = Literal["ready", "warning", "missing", "blocked"]
VoiceSelectionStatus = Literal["ready", "idle", "missing", "blocked"]


class SetupStep(BaseModel):
    id: str
    label: str
    status: SetupStatus
    required: bool
    detail: str
    action: str | None = None


class VoicePresetDiagnostic(BaseModel):
    voice_id: str
    display_name: str
    declared_gender: str
    filename: str
    manifest_filename: str
    schema_version: int | None = None
    status: VoicePresetStatus
    usable: bool
    audio_usable: bool = False
    manifest_status: VoicePresetStatus = "missing"
    manifest_valid: bool = False
    consent_status: str = "missing"
    human_review_status: str = "missing"
    source_type: str = "unknown"
    allowed_uses: list[str] = Field(default_factory=list)
    declared_sha256: str | None = None
    actual_sha256: str | None = None
    checksum_matches: bool | None = None
    review_audio_sha256: str | None = None
    review_checksum_matches: bool | None = None
    approval_id: str | None = None
    signature_mode: str = "unsigned"
    signing_key_id: str | None = None
    signature_status: str = "missing"
    signed_payload_sha256: str | None = None
    neural_preview_engine_id: str | None = None
    model_id: str | None = None
    model_fingerprint: str | None = None
    reference_fingerprint: str | None = None
    neural_preview_ready: bool = False
    preview_cache_key: str | None = None
    consent_expires_at: str | None = None
    rights_expires_at: str | None = None
    consent_days_remaining: int | None = None
    rights_days_remaining: int | None = None
    duplicate_voice_ids: list[str] = Field(default_factory=list)
    duration_seconds: float | None = None
    sample_rate: int | None = None
    channel_count: int | None = None
    sample_width_bits: int | None = None
    rms_db: float | None = None
    silence_ratio: float | None = None
    clipping_ratio: float | None = None
    issues: list[str]


class VoiceSelectionDiagnostic(BaseModel):
    engine_id: str
    engine_name: str
    voice_id: str
    display_name: str
    expected_gender: str
    status: VoiceSelectionStatus
    selected_voice_id: str | None = None
    selected_voice_name: str | None = None
    selected_gender: str | None = None
    selection_basis: str
    reason: str


class SetupStatusResponse(BaseModel):
    version: str
    ready: bool
    real_engine_count: int
    voice_preset_ready_count: int = 0
    voice_preset_audio_ready_count: int = 0
    voice_preset_manifest_ready_count: int = 0
    voice_preset_expected_count: int = 5
    voice_preset_duplicate_group_count: int = 0
    voice_preset_diagnostics: list[VoicePresetDiagnostic] = Field(default_factory=list)
    voice_selection_diagnostics: list[VoiceSelectionDiagnostic] = Field(default_factory=list)
    steps: list[SetupStep]
