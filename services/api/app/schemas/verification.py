from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

DeviceProfile = Literal["cuda", "apple-silicon", "cpu", "android", "ios"]
DeviceScenario = Literal["baseline", "network-switch", "background-resume", "installed-pwa"]


class DeviceBenchmarkRequest(BaseModel):
    device_profile: DeviceProfile
    device_name: str = Field(min_length=1, max_length=120)
    engine_id: str = Field(min_length=1, max_length=80)
    model_id: str = Field(min_length=1, max_length=120)
    model_version: str = Field(min_length=1, max_length=80)
    model_digest: str = Field(default="", max_length=128)
    accelerator_name: str = Field(default="unknown", min_length=1, max_length=120)
    gpu_name: str = Field(default="", max_length=160)
    preset_id: str = Field(default="unknown", min_length=1, max_length=80)
    sample_minutes: int = Field(ge=1, le=120)
    soak_elapsed_seconds: float | None = Field(default=None, ge=0, le=43200)
    scenario: DeviceScenario = "baseline"
    browser_version: str = Field(default="", max_length=120)
    first_audio_ms: int | None = Field(default=None, ge=0)
    processing_seconds: float = Field(gt=0)
    audio_duration_seconds: float = Field(gt=0)
    peak_memory_mb: float | None = Field(default=None, ge=0)
    peak_vram_mb: float | None = Field(default=None, ge=0)
    retry_count: int = Field(default=0, ge=0)
    failure_count: int = Field(default=0, ge=0)
    playback_completed: bool = True
    sse_reconnected: bool | None = None
    audio_fetch_recovered: bool | None = None
    sse_reconnect_ms: int | None = Field(default=None, ge=0, le=600000)
    audio_fetch_recovery_ms: int | None = Field(default=None, ge=0, le=600000)
    playback_interruption_ms: int | None = Field(default=None, ge=0, le=600000)
    seam_p95_ms: int | None = Field(default=None, ge=0)
    seam_p95_waited_ms: int | None = Field(default=None, ge=0)
    seam_p95_decode_ms: int | None = Field(default=None, ge=0)
    final_handoff_error_ms: int | None = Field(default=None, ge=0)
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


class DeviceCertificationCoverage(BaseModel):
    profile: Literal["android", "ios"]
    scenario: DeviceScenario
    sample_minutes: int
    recorded: bool
    latest_status: Literal["ready", "warning", "failed"] | None = None


class DeviceMetricAggregate(BaseModel):
    device_profile: DeviceProfile
    engine_id: str
    model_id: str
    model_version: str
    model_digest: str
    accelerator_name: str
    gpu_name: str
    preset_id: str
    records: int
    ready_records: int
    failure_rate: float
    average_realtime_factor: float
    p50_realtime_factor: float
    p95_realtime_factor: float
    p50_first_audio_ms: int | None = None
    p95_first_audio_ms: int | None = None
    p95_sse_reconnect_ms: int | None = None
    p95_audio_fetch_recovery_ms: int | None = None
    p95_playback_interruption_ms: int | None = None
    p95_seam_waited_ms: int | None = None
    p95_seam_decode_ms: int | None = None
    p50_final_handoff_error_ms: int | None = None
    p95_final_handoff_error_ms: int | None = None


class DeviceBenchmarkSummaryResponse(BaseModel):
    total_records: int
    ready_records: int
    warning_records: int
    failed_records: int
    coverage: list[DeviceBenchmarkCoverage]
    missing_scenarios: list[str]
    certification_coverage: list[DeviceCertificationCoverage] = Field(default_factory=list)
    missing_certifications: list[str] = Field(default_factory=list)
    metric_groups: list[DeviceMetricAggregate] = Field(default_factory=list)


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


class WorkerSynthesisTelemetryResponse(BaseModel):
    id: str
    recorded_at: datetime
    engine_id: str
    worker_job_id: str
    preset_id: str
    model_id: str
    model_version: str
    model_digest: str
    device_profile: str
    accelerator_name: str
    gpu_name: str
    first_audio_ms: int | None = None
    processing_ms: int
    audio_duration_seconds: float | None = None
    realtime_factor: float | None = None
    final_handoff_error_ms: int | None = None
    succeeded: bool
    failure_reason: str = ""


class BenchmarkMetricWindow(BaseModel):
    records: int = Field(ge=0)
    failure_rate: float = Field(ge=0, le=1)
    p95_first_audio_ms: int | None = None
    p95_realtime_factor: float | None = None
    p95_final_handoff_error_ms: int | None = None


class BenchmarkRegressionAssessment(BaseModel):
    status: Literal["insufficient", "stable", "warning", "regressed"]
    minimum_records: int = Field(ge=2)
    available_records: int = Field(ge=0)
    baseline: BenchmarkMetricWindow | None = None
    current: BenchmarkMetricWindow | None = None
    reasons: list[str] = Field(default_factory=list)


class OperatorBaselineCreateRequest(BaseModel):
    engine_id: str = Field(min_length=1, max_length=80)
    preset_id: str = Field(min_length=1, max_length=80)
    model_id: str = Field(min_length=1, max_length=120)
    model_version: str = Field(min_length=1, max_length=80)
    model_digest: str = Field(default="", max_length=128)
    device_profile: str = Field(min_length=1, max_length=80)
    accelerator_name: str = Field(min_length=1, max_length=120)
    gpu_name: str = Field(default="", max_length=160)
    confirmation: str = Field(min_length=1, max_length=80)
    note: str = Field(default="", max_length=500)


class OperatorBaselineRetireRequest(BaseModel):
    confirmation: str = Field(min_length=1, max_length=80)
    reason: str = Field(min_length=1, max_length=500)


class OperatorBaselineRestoreRequest(BaseModel):
    confirmation: str = Field(min_length=1, max_length=80)
    reason: str = Field(min_length=1, max_length=500)


class OperatorBenchmarkBaseline(BaseModel):
    baseline_id: str
    group_key: str
    engine_id: str
    preset_id: str
    model_id: str
    model_version: str
    model_digest: str
    device_profile: str
    accelerator_name: str
    gpu_name: str
    source_records: int = Field(ge=1)
    source_records_sha256: str = Field(min_length=64, max_length=64)
    metrics: BenchmarkMetricWindow
    created_at: datetime
    actor: str
    note: str = ""


class OperatorBaselineHistoryEntry(BaseModel):
    baseline: OperatorBenchmarkBaseline
    status: Literal["active", "retired"]
    retired_at: datetime | None = None
    retired_by: str = ""
    retired_reason: str = ""
    replacement_baseline_id: str = ""
    last_restored_at: datetime | None = None
    last_restored_by: str = ""
    last_restore_reason: str = ""


class OperatorBaselineRestorePreview(BaseModel):
    target: OperatorBenchmarkBaseline
    current_active: OperatorBenchmarkBaseline | None = None
    will_replace_active: bool = False
    summary: list[str] = Field(default_factory=list)


class OperatorBenchmarkRegressionAssessment(BaseModel):
    baseline_id: str
    status: Literal["insufficient", "stable", "warning", "regressed"]
    available_records: int = Field(ge=0)
    current: BenchmarkMetricWindow | None = None
    reasons: list[str] = Field(default_factory=list)


class WorkerTelemetryAggregate(BaseModel):
    engine_id: str
    preset_id: str
    model_id: str
    model_version: str
    model_digest: str
    device_profile: str
    accelerator_name: str
    gpu_name: str
    records: int
    success_records: int
    failure_rate: float
    p50_first_audio_ms: int | None = None
    p95_first_audio_ms: int | None = None
    p50_realtime_factor: float | None = None
    p95_realtime_factor: float | None = None
    p50_final_handoff_error_ms: int | None = None
    p95_final_handoff_error_ms: int | None = None
    regression: BenchmarkRegressionAssessment
    operator_baseline: OperatorBenchmarkBaseline | None = None
    operator_regression: OperatorBenchmarkRegressionAssessment | None = None


class WorkerTelemetrySummaryResponse(BaseModel):
    total_records: int
    success_records: int
    failed_records: int
    metric_groups: list[WorkerTelemetryAggregate] = Field(default_factory=list)
