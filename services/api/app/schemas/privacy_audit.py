from datetime import datetime

from pydantic import BaseModel, Field

from app.schemas.evidence import QualityEvidenceManifest


class PrivacyAuditBundleResponse(BaseModel):
    schema_version: str
    app_version: str
    exported_at: datetime
    redacted: bool = True
    approval_history: list[dict[str, object]] = Field(default_factory=list)
    trust_rotation: dict[str, object]
    benchmark_regressions: list[dict[str, object]] = Field(default_factory=list)
    device_coverage: dict[str, object]
    manifest: QualityEvidenceManifest


class PrivacyAuditVerificationResponse(BaseModel):
    valid: bool
    provided_sha256: str | None = None
    expected_sha256: str | None = None
    record_count: int = Field(ge=0)
    reason: str
