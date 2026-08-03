from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

from app.schemas.verification import SttMeasurementResponse


class SttRegenerationComparisonRequest(BaseModel):
    segment_id: str = Field(min_length=1, max_length=120)
    reference_text: str = Field(min_length=1, max_length=5000)
    before_transcript: str = Field(min_length=1, max_length=5000)
    after_transcript: str = Field(min_length=1, max_length=5000)
    engine_id: str = Field(default="faster-whisper", min_length=1, max_length=80)
    model_id: str = Field(default="unknown", min_length=1, max_length=120)
    device_profile: str = Field(default="unknown", min_length=1, max_length=80)
    before_audio_duration_seconds: float | None = Field(default=None, gt=0)
    before_processing_seconds: float | None = Field(default=None, gt=0)
    after_audio_duration_seconds: float | None = Field(default=None, gt=0)
    after_processing_seconds: float | None = Field(default=None, gt=0)


class SttRegenerationComparisonResponse(BaseModel):
    id: str
    recorded_at: datetime
    segment_id: str
    engine_id: str
    model_id: str
    device_profile: str
    before: SttMeasurementResponse
    after: SttMeasurementResponse
    character_error_improvement: float
    word_error_improvement: float
    critical_error_improvement: int
    improved: bool
    passed_after: bool


class SttComparisonSummaryResponse(BaseModel):
    total_records: int
    improved_records: int
    passed_after_records: int
    average_character_error_improvement: float
    average_word_error_improvement: float
    latest_recorded_at: datetime | None = None


class ExportSoakRecordRequest(BaseModel):
    sample_minutes: int = Field(ge=1, le=120)
    output_format: Literal["wav", "mp3"]
    segment_count: int = Field(ge=1, le=5000)
    expected_duration_seconds: float = Field(gt=0)
    actual_duration_seconds: float = Field(ge=0)
    processing_seconds: float = Field(gt=0)
    peak_memory_mb: float | None = Field(default=None, ge=0)
    output_bytes: int = Field(default=0, ge=0)
    subtitle_end_seconds: float | None = Field(default=None, ge=0)
    audio_duration_source: Literal["wave", "ffprobe", "export-contract"] = "export-contract"
    succeeded: bool
    notes: str = Field(default="", max_length=1000)


class ExportSoakRecordResponse(ExportSoakRecordRequest):
    id: str
    recorded_at: datetime
    realtime_factor: float | None
    duration_drift_ms: float
    subtitle_drift_ms: float | None
    status: Literal["ready", "warning", "failed"]


class ExportSoakCoverage(BaseModel):
    sample_minutes: int
    output_format: Literal["wav", "mp3"]
    recorded: bool
    latest_status: Literal["ready", "warning", "failed"] | None = None
    latest_realtime_factor: float | None = None
    latest_subtitle_drift_ms: float | None = None


class ExportSoakSummaryResponse(BaseModel):
    total_records: int
    ready_records: int
    warning_records: int
    failed_records: int
    coverage: list[ExportSoakCoverage]
    missing_scenarios: list[str]


class EvidenceRecordDigest(BaseModel):
    category: str
    id: str
    sha256: str = Field(pattern=r"^[0-9a-f]{64}$")


class QualityEvidenceManifest(BaseModel):
    schema_version: str
    record_count: int = Field(ge=0)
    category_counts: dict[str, int]
    records_sha256: str = Field(pattern=r"^[0-9a-f]{64}$")
    records: list[EvidenceRecordDigest]
    bundle_sha256: str = Field(pattern=r"^[0-9a-f]{64}$")


class QualityEvidenceSummaryResponse(BaseModel):
    stt: SttComparisonSummaryResponse
    export_soak: ExportSoakSummaryResponse
    manifest: QualityEvidenceManifest | None = None


class QualityEvidenceBundleResponse(BaseModel):
    schema_version: str
    app_version: str
    exported_at: datetime
    redacted: bool
    device_benchmarks: list[dict[str, object]]
    stt_regeneration_comparisons: list[dict[str, object]]
    export_soak_records: list[dict[str, object]]
    summary: QualityEvidenceSummaryResponse
    manifest: QualityEvidenceManifest


class QualityEvidenceVerificationResponse(BaseModel):
    valid: bool
    provided_sha256: str | None = None
    expected_sha256: str | None = None
    record_count: int = Field(ge=0)
    reason: str


class EvidenceIntakeSource(BaseModel):
    name: str = Field(default="imported-evidence.json", min_length=1, max_length=240)
    kind: Literal["manual", "github-actions", "device", "cosyvoice"] = "manual"
    commit_sha: str = Field(default="", max_length=80)
    run_id: str = Field(default="", max_length=120)


class EvidenceIntakeRequest(BaseModel):
    bundle: dict[str, object]
    source: EvidenceIntakeSource = Field(default_factory=EvidenceIntakeSource)


class EvidenceIntakePreviewResponse(BaseModel):
    valid: bool
    importable: bool
    duplicate_bundle: bool
    duplicate_record_count: int = Field(ge=0)
    bundle_sha256: str | None = None
    schema_version: str | None = None
    app_version: str | None = None
    record_count: int = Field(ge=0)
    reason: str


class EvidenceIntakeRecordResponse(BaseModel):
    bundle_sha256: str = Field(pattern=r"^[0-9a-f]{64}$")
    schema_version: str
    app_version: str
    record_count: int = Field(ge=0)
    source_name: str
    source_kind: str
    commit_sha: str
    run_id: str
    imported_at: datetime


class EvidenceIntakeImportResponse(BaseModel):
    imported: bool
    record: EvidenceIntakeRecordResponse | None = None
    reason: str
