from functools import lru_cache
from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class WorkerSettings(BaseSettings):
    model_config = SettingsConfigDict(
        env_prefix="SORION_WORKER_",
        env_file=".env",
        extra="ignore",
    )

    environment: str = "development"
    output_path: Path = Path(".sorion/worker")
    model_path: Path | None = None
    adapter_module: str = "app.adapters.cosyvoice3"
    device: str = "auto"
    allow_cpu: bool = False
    min_vram_mb: int = Field(default=8192, ge=0, le=262144)
    required_model_files: str = ""
    max_concurrent_jobs: int = Field(default=1, ge=1, le=4)
    max_sample_bytes: int = Field(default=25 * 1024 * 1024, ge=1024)
    job_ttl_minutes: int = Field(default=60, ge=5, le=1440)
    cors_origins: str = "http://127.0.0.1:8000,http://localhost:8000"
    service_token: str = ""
    signature_secret: str = ""
    auth_ttl_seconds: int = Field(default=30, ge=5, le=300)
    rate_limit_per_minute: int = Field(default=240, ge=10, le=10000)
    audit_path: Path | None = None

    @property
    def cors_origin_list(self) -> list[str]:
        return [value.strip() for value in self.cors_origins.split(",") if value.strip()]

    @property
    def required_model_file_list(self) -> list[str]:
        return [value.strip() for value in self.required_model_files.split(",") if value.strip()]

    @property
    def auth_enabled(self) -> bool:
        return bool(self.service_token and self.signature_secret)

    @property
    def auth_ready(self) -> bool:
        both_empty = not self.service_token and not self.signature_secret
        return self.auth_enabled or (both_empty and self.environment != "production")

    @property
    def resolved_audit_path(self) -> Path:
        return self.audit_path or self.output_path / "audit.jsonl"


@lru_cache
def get_settings() -> WorkerSettings:
    return WorkerSettings()
