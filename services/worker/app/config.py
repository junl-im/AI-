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
    max_concurrent_jobs: int = Field(default=1, ge=1, le=4)
    max_sample_bytes: int = Field(default=25 * 1024 * 1024, ge=1024)
    job_ttl_minutes: int = Field(default=60, ge=5, le=1440)
    cors_origins: str = "http://127.0.0.1:8000,http://localhost:8000"

    @property
    def cors_origin_list(self) -> list[str]:
        return [value.strip() for value in self.cors_origins.split(",") if value.strip()]


@lru_cache
def get_settings() -> WorkerSettings:
    return WorkerSettings()
