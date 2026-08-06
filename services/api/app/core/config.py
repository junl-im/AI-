from functools import lru_cache
from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

from app.services.voice_review_trust import parse_trusted_keys_json


class Settings(BaseSettings):
    environment: str = "development"
    cors_origins: str = (
        "http://localhost:5173,http://127.0.0.1:5173,"
        "https://junl-im.github.io"
    )
    default_tts_engine: str = "auto"
    tts_engine_order: str = "cosyvoice3,melo,system,mock"
    engine_failure_threshold: int = Field(default=2, ge=1, le=10)
    engine_cooldown_seconds: float = Field(default=30.0, ge=1.0, le=600.0)
    allow_mock_engine: bool = True
    enable_melo_tts: bool = True
    melo_device: str = "auto"
    enable_system_tts: bool = True
    system_tts_voice: str = ""
    generation_timeout_seconds: float = 75.0
    max_concurrent_generations: int = 1
    job_store_path: str = ".sorion/jobs.sqlite3"
    job_claim_ttl_seconds: float = 120.0
    job_result_ttl_minutes: int = 30
    job_history_ttl_hours: int = 24
    job_poll_interval_seconds: float = 0.1
    audio_ttl_minutes: int = 30
    segment_url_ttl_seconds: int = Field(default=900, ge=30, le=3600)
    segment_url_signing_secret: str = ""
    max_segment_chars: int = 180
    audio_directory: str = ".sorion/audio"
    voice_clone_directory: str = ".sorion/voice-clones"
    voice_clone_ttl_days: int = 7
    voice_clone_max_file_bytes: int = 25 * 1024 * 1024
    cosyvoice_worker_url: str = ""
    cosyvoice_worker_timeout_seconds: float = 2.5
    cosyvoice_worker_job_timeout_seconds: float = 45.0
    cosyvoice_worker_probe_interval_seconds: float = Field(default=15.0, ge=5.0, le=300.0)
    cosyvoice_tts_reference_path: str = ""
    cosyvoice_tts_profile_id: str = "sorion-korean-reference"
    cosyvoice_preset_directory: str = ""
    worker_service_token: str = ""
    worker_signature_secret: str = ""
    public_rate_limit_per_minute: int = Field(default=120, ge=10, le=5000)
    trusted_proxy_cidrs: str = "127.0.0.1/32,::1/128"
    allow_private_network: bool = True
    audit_log_path: str = ".sorion/audit/api.jsonl"
    device_benchmark_path: str = ".sorion/quality/device-benchmarks.jsonl"
    stt_comparison_path: str = ".sorion/quality/stt-regeneration-comparisons.jsonl"
    export_soak_path: str = ".sorion/quality/export-soak.jsonl"
    evidence_intake_path: str = ".sorion/quality/imported-evidence.jsonl"
    voice_review_approval_path: str = ".sorion/quality/voice-review-approvals.jsonl"
    voice_review_signing_secret: str = ""
    voice_review_signing_key_id: str = "local-review-key"
    voice_review_trusted_keys_json: str = ""
    voice_review_lock_timeout_seconds: float = Field(default=10.0, ge=0.1, le=120.0)
    voice_review_writer_lease_path: str = ".sorion/quality/voice-review-writer.sqlite3"
    voice_review_writer_lease_seconds: float = Field(default=30.0, ge=5.0, le=300.0)
    voice_review_operator_token: str = ""
    voice_review_allow_loopback_without_token: bool = True
    worker_telemetry_path: str = ".sorion/quality/worker-synthesis-telemetry.jsonl"
    operator_baseline_path: str = ".sorion/quality/operator-benchmark-baselines.jsonl"
    stt_directory: str = ".sorion/stt"
    stt_max_file_bytes: int = 100 * 1024 * 1024
    faster_whisper_model: str = "small"
    faster_whisper_device: str = "auto"
    faster_whisper_compute_type: str = "default"

    model_config = SettingsConfigDict(
        env_file=(".env", "../../.env"),
        env_prefix="SORION_",
        extra="ignore",
    )

    @property
    def cors_origin_list(self) -> list[str]:
        return [item.strip() for item in self.cors_origins.split(",") if item.strip()]

    @property
    def trusted_proxy_cidr_list(self) -> list[str]:
        return [
            item.strip()
            for item in self.trusted_proxy_cidrs.split(",")
            if item.strip()
        ]

    @property
    def audio_path(self) -> Path:
        return Path(self.audio_directory).expanduser().resolve()

    @property
    def job_store_file(self) -> Path:
        return Path(self.job_store_path).expanduser().resolve()

    @property
    def voice_clone_path(self) -> Path:
        return Path(self.voice_clone_directory).expanduser().resolve()

    @property
    def audit_path(self) -> Path:
        return Path(self.audit_log_path).expanduser().resolve()

    @property
    def device_benchmark_file(self) -> Path:
        return Path(self.device_benchmark_path).expanduser().resolve()

    @property
    def stt_comparison_file(self) -> Path:
        return Path(self.stt_comparison_path).expanduser().resolve()

    @property
    def export_soak_file(self) -> Path:
        return Path(self.export_soak_path).expanduser().resolve()

    @property
    def evidence_intake_file(self) -> Path:
        return Path(self.evidence_intake_path).expanduser().resolve()

    @property
    def voice_review_approval_file(self) -> Path:
        return Path(self.voice_review_approval_path).expanduser().resolve()

    @property
    def voice_review_writer_lease_file(self) -> Path:
        return Path(self.voice_review_writer_lease_path).expanduser().resolve()

    @property
    def voice_review_trusted_key_map(self) -> dict[str, str]:
        return parse_trusted_keys_json(self.voice_review_trusted_keys_json)

    @property
    def worker_telemetry_file(self) -> Path:
        return Path(self.worker_telemetry_path).expanduser().resolve()

    @property
    def operator_baseline_file(self) -> Path:
        return Path(self.operator_baseline_path).expanduser().resolve()

    @property
    def stt_path(self) -> Path:
        return Path(self.stt_directory).expanduser().resolve()

    @property
    def cosyvoice_preset_path(self) -> Path | None:
        value = self.cosyvoice_preset_directory.strip()
        return Path(value).expanduser().resolve() if value else None

    @property
    def tts_engine_order_list(self) -> list[str]:
        return [item.strip() for item in self.tts_engine_order.split(",") if item.strip()]

    @property
    def worker_auth_enabled(self) -> bool:
        return bool(self.worker_service_token and self.worker_signature_secret)


@lru_cache
def get_settings() -> Settings:
    return Settings()
