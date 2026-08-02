from typing import Literal

from pydantic import BaseModel, Field

WorkerJobStatus = Literal[
    "queued",
    "running",
    "completed",
    "failed",
    "cancelled",
]
WorkerSegmentStatus = Literal[
    "queued",
    "running",
    "completed",
    "failed",
    "cancelled",
]


class HealthResponse(BaseModel):
    status: Literal["ok"] = "ok"
    version: str = "0.9.3-beta.1"
    service: str = "sorion-cosyvoice-worker"


class WorkerDiagnosticsResponse(BaseModel):
    ready: bool
    backend: str
    reason: str
    device: str
    model_path: str | None
    model_exists: bool
    missing_model_files: list[str]
    adapter_module: str | None
    adapter_loaded: bool
    torch_available: bool
    cuda_available: bool
    cuda_device_count: int
    gpu_name: str | None
    vram_total_mb: int | None
    disk_free_mb: int | None
    security_enabled: bool
    security_ready: bool
    mps_available: bool = False
    hardware_profile: str = "unavailable"
    hardware_supported: bool = False
    hardware_reason: str = "실행 장치 진단이 없습니다."
    model_manifest_required: bool = True
    model_manifest_path: str | None = None
    model_manifest_exists: bool = False
    model_manifest_valid: bool = False
    model_id: str | None = None
    model_version: str | None = None
    model_license_name: str | None = None
    model_license_url: str | None = None
    model_license_requires_acceptance: bool = False
    model_license_accepted: bool = False
    model_checksum_verified: bool = False
    model_checksum_failures: list[str] = Field(default_factory=list)
    model_declared_file_count: int = 0
    model_verified_file_count: int = 0
    model_size_mb: int | None = None
    model_install_state: str = "unknown"
    min_disk_free_mb: int = 0


class ReadinessResponse(BaseModel):
    status: Literal["ready", "not-ready"]
    version: str = "0.9.3-beta.1"
    diagnostics: WorkerDiagnosticsResponse


class WorkerSegmentResponse(BaseModel):
    index: int
    text: str
    status: WorkerSegmentStatus
    progress: int = Field(ge=0, le=100)
    message: str
    error: str | None = None
    audio_url: str | None = None


class WorkerJobResponse(BaseModel):
    id: str
    profile_id: str
    status: WorkerJobStatus
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
    segments: list[WorkerSegmentResponse]
