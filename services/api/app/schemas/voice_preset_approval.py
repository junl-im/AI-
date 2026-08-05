from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class VoicePresetApprovalInput(BaseModel):
    voice_id: str = Field(min_length=1, max_length=100)
    reviewer: str = Field(min_length=1, max_length=120)
    sample_text: str = Field(min_length=1, max_length=3000)
    review_bundle_sha256: str = Field(min_length=64, max_length=64)
    expected_audio_sha256: str = Field(min_length=64, max_length=64)
    expected_manifest_sha256: str | None = Field(default=None, min_length=64, max_length=64)
    reviewed_at: datetime | None = None
    notes: str = Field(default="", max_length=1000)


class VoicePresetApprovalDiff(BaseModel):
    path: str
    before: object | None = None
    after: object | None = None


class VoicePresetApprovalPreviewResponse(BaseModel):
    preview_id: str
    approval_id: str
    voice_id: str
    current_audio_sha256: str
    current_manifest_sha256: str
    proposed_manifest_sha256: str
    proposed_manifest: dict[str, object]
    changes: list[VoicePresetApprovalDiff]
    blocking_issues: list[str]
    warnings: list[str]
    duplicate_voice_ids: list[str]
    signature_mode: Literal["unsigned", "hmac-sha256"]
    signing_key_id: str | None = None
    can_apply: bool


class VoicePresetApprovalApplyRequest(VoicePresetApprovalInput):
    preview_id: str = Field(min_length=64, max_length=64)
    confirmation: str = Field(min_length=1, max_length=80)


class VoicePresetApprovalRecord(BaseModel):
    approval_id: str
    event: Literal["approved", "rolled-back"]
    voice_id: str
    actor: str
    reviewer: str
    at: datetime
    audio_sha256: str
    before_manifest_sha256: str
    after_manifest_sha256: str
    review_bundle_sha256: str
    signature_mode: Literal["unsigned", "hmac-sha256"]
    signing_key_id: str | None = None
    signed_payload_sha256: str | None = None
    signature: str | None = None
    related_approval_id: str | None = None


class VoicePresetApprovalApplyResponse(BaseModel):
    status: Literal["approved"]
    record: VoicePresetApprovalRecord
    manifest: dict[str, object]


class VoicePresetApprovalRollbackRequest(BaseModel):
    confirmation: str = Field(min_length=1, max_length=80)
    reason: str = Field(min_length=1, max_length=500)


class VoicePresetApprovalRollbackResponse(BaseModel):
    status: Literal["rolled-back"]
    record: VoicePresetApprovalRecord
    manifest: dict[str, object]
