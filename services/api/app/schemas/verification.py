from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

DeviceProfile = Literal["cuda", "apple-silicon", "cpu", "android", "ios"]


class DeviceBenchmarkRequest(BaseModel):
    device_profile: DeviceProfile
    device_name: str = Field(min_length=1, max_length=120)
    engine_id: str = Field(min_length=1, max_length=80)
    model_id: str = Field(min_length=1, max_length=120)
    model_version: str = Field(min_length=1, max_length=80)
    sample_minutes: int = Field(ge=1, le=120)
    first_audio_ms: int | None = Field(default=None, ge=0)
    processing_seconds: float = Field(gt=0)
    audio_duration_seconds: float = Field(gt=0)
    peak_memory_mb: float | None = Field(default=None, ge=0)
    peak_vram_mb: float | None = Field(default=None, ge=0)
    retry_count: int = Field(default=0, ge=0)
    failure_count: int = Field(default=0, ge=0)
    succeeded: bool
    notes: str = Field(default="", max_length=1000)


class DeviceBenchmarkResponse(DeviceBenchmarkRequest):
    id: str
    recorded_at: datetime
    realtime_factor: float
    status: Literal["ready", "warning", "failed"]


class CriticalTokenMetric(BaseModel):
    reference_count: int
    error_count: int
    error_rate: float
    missing: list[str]
    unexpected: list[str]


class SttMeasurementRequest(BaseModel):
    reference_text: str = Field(min_length=1, max_length=20000)
    transcript_text: str = Field(min_length=1, max_length=20000)
    engine_id: str = Field(default="faster-whisper", min_length=1, max_length=80)
    model_id: str = Field(default="unknown", min_length=1, max_length=120)
    device_profile: str = Field(default="unknown", min_length=1, max_length=80)
    audio_duration_seconds: float | None = Field(default=None, gt=0)
    processing_seconds: float | None = Field(default=None, gt=0)


class SttMeasurementResponse(BaseModel):
    reference_text: str
    transcript_text: str
    engine_id: str
    model_id: str
    device_profile: str
    character_error_rate: float
    character_errors: int
    character_reference_length: int
    word_error_rate: float
    word_errors: int
    word_reference_length: int
    critical_tokens: dict[str, CriticalTokenMetric]
    realtime_factor: float | None
    needs_regeneration: bool


class SttProbeResponse(BaseModel):
    engine_id: str
    ready: bool
    reason: str
    model_name: str
    device: str
    compute_type: str


class DeviceBenchmarkCoverage(BaseModel):
    profile: DeviceProfile
    sample_minutes: int
    recorded: bool
    latest_status: Literal["ready", "warning", "failed"] | None = None
    latest_realtime_factor: float | None = None


class DeviceBenchmarkSummaryResponse(BaseModel):
    total_records: int
    ready_records: int
    warning_records: int
    failed_records: int
    coverage: list[DeviceBenchmarkCoverage]
    missing_scenarios: list[str]


class SttSegmentVerificationRequest(BaseModel):
    segment_id: str = Field(min_length=1, max_length=120)
    audio_filename: str = Field(min_length=1, max_length=255)
    reference_text: str = Field(min_length=1, max_length=5000)
    regeneration_attempts: int = Field(default=0, ge=0, le=10)


class SttBatchVerificationRequest(BaseModel):
    segments: list[SttSegmentVerificationRequest] = Field(min_length=1, max_length=500)
    character_error_threshold: float = Field(default=0.08, ge=0, le=1)
    word_error_threshold: float = Field(default=0.15, ge=0, le=1)
    max_regeneration_attempts: int = Field(default=2, ge=0, le=5)
    max_regenerations_per_run: int = Field(default=20, ge=0, le=100)


class SttSegmentVerificationResponse(BaseModel):
    segment_id: str
    audio_filename: str
    transcript_text: str
    character_error_rate: float
    word_error_rate: float
    critical_tokens: dict[str, CriticalTokenMetric]
    realtime_factor: float | None
    needs_regeneration: bool
    regeneration_allowed: bool
    reasons: list[str]


class SttBatchVerificationResponse(BaseModel):
    engine_id: str
    model_id: str
    device_profile: str
    results: list[SttSegmentVerificationResponse]
    regeneration_segment_ids: list[str]
    blocked_segment_ids: list[str]
    processing_seconds: float
