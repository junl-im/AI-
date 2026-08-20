from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

from app.services.voice_presets import VoiceGender

ConsentStatus = Literal["pending", "confirmed", "rejected", "expired"]
HumanReviewStatus = Literal["pending", "approved", "rejected"]
ApprovalSignatureMode = Literal["unsigned", "hmac-sha256"]
SourceType = Literal[
    "self-recorded",
    "commissioned",
    "licensed",
    "synthetic",
    "unknown",
]


class VoiceConsentRecord(BaseModel):
    status: ConsentStatus = "pending"
    subject_reference: str = ""
    evidence_reference: str = ""
    consented_at: datetime | None = None
    expires_at: datetime | None = None
    notes: str = ""


class VoiceRightsRecord(BaseModel):
    source_type: SourceType = "unknown"
    source_reference: str = ""
    allowed_uses: list[str] = Field(default_factory=list)
    commercial_use: bool = False
    redistribution: bool = False
    training_use: bool = False
    expires_at: datetime | None = None
    notes: str = ""


class VoiceIntegrityRecord(BaseModel):
    sha256: str = ""
    file_size_bytes: int | None = Field(default=None, ge=0)


class VoiceHumanReviewRecord(BaseModel):
    status: HumanReviewStatus = "pending"
    reviewer: str = ""
    reviewed_at: datetime | None = None
    sample_text: str = ""
    audio_sha256: str = ""
    source_review_bundle_sha256: str = ""
    approval_id: str = ""
    notes: str = ""


class VoiceNeuralPreviewRecord(BaseModel):
    engine_id: str = "cosyvoice3"
    model_id: str = ""
    model_fingerprint: str = ""
    reference_fingerprint: str = ""
    notes: str = ""


class VoiceApprovalSignatureRecord(BaseModel):
    mode: ApprovalSignatureMode = "unsigned"
    key_id: str = ""
    signed_at: datetime | None = None
    signed_payload_sha256: str = ""
    signature: str = ""


class VoicePresetManifest(BaseModel):
    schema_version: Literal[1, 2, 3, 4] = 2
    voice_id: str = Field(min_length=1, max_length=100)
    display_name: str = Field(min_length=1, max_length=100)
    declared_gender: VoiceGender
    reference_file: str = Field(min_length=1, max_length=255)
    consent: VoiceConsentRecord = Field(default_factory=VoiceConsentRecord)
    rights: VoiceRightsRecord = Field(default_factory=VoiceRightsRecord)
    integrity: VoiceIntegrityRecord = Field(default_factory=VoiceIntegrityRecord)
    human_review: VoiceHumanReviewRecord = Field(default_factory=VoiceHumanReviewRecord)
    neural_preview: VoiceNeuralPreviewRecord = Field(default_factory=VoiceNeuralPreviewRecord)
    approval: VoiceApprovalSignatureRecord = Field(default_factory=VoiceApprovalSignatureRecord)
