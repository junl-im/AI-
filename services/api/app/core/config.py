from functools import lru_cache
from pathlib import Path
from typing import Literal

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    environment: str = "development"
    cors_origins: str = (
        "http://localhost:5173,http://127.0.0.1:5173,"
        "https://junl-im.github.io"
    )
    default_tts_engine: str = "auto"
    engine_cost_policy: Literal["free-only", "balanced"] = "free-only"
    tts_engine_order: str = (
        "cosyvoice3,melo,system,naver-clova,google-chirp3-hd,"
        "azure-speech,elevenlabs-v3,mock"
    )
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
    max_segment_chars: int = 180
    audio_directory: str = ".sorion/audio"
    voice_clone_directory: str = ".sorion/voice-clones"
    voice_clone_ttl_days: int = 7
    voice_clone_max_file_bytes: int = 25 * 1024 * 1024
    cosyvoice_worker_url: str = ""
    cosyvoice_worker_timeout_seconds: float = 2.5
    cosyvoice_worker_job_timeout_seconds: float = 45.0
    cosyvoice_tts_reference_path: str = ""
    cosyvoice_tts_profile_id: str = "sorion-korean-reference"
    worker_service_token: str = ""
    worker_signature_secret: str = ""
    naver_clova_client_id: str = ""
    naver_clova_client_secret: str = ""
    naver_clova_speaker: str = "nara"
    google_tts_api_key: str = ""
    google_tts_voice: str = "ko-KR-Chirp3-HD-Aoede"
    azure_speech_key: str = ""
    azure_speech_region: str = ""
    azure_speech_voice: str = "ko-KR-SunHiNeural"
    elevenlabs_api_key: str = ""
    elevenlabs_voice_id: str = ""
    elevenlabs_model_id: str = "eleven_v3"
    cloud_tts_timeout_seconds: float = Field(default=45.0, ge=5.0, le=180.0)
    public_rate_limit_per_minute: int = Field(default=120, ge=10, le=5000)
    allow_private_network: bool = True
    audit_log_path: str = ".sorion/audit/api.jsonl"

    model_config = SettingsConfigDict(
        env_file=(".env", "../../.env"),
        env_prefix="SORION_",
        extra="ignore",
    )

    @property
    def cors_origin_list(self) -> list[str]:
        return [item.strip() for item in self.cors_origins.split(",") if item.strip()]

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
    def tts_engine_order_list(self) -> list[str]:
        return [item.strip() for item in self.tts_engine_order.split(",") if item.strip()]

    @property
    def worker_auth_enabled(self) -> bool:
        return bool(self.worker_service_token and self.worker_signature_secret)

    @property
    def metered_tts_enabled(self) -> bool:
        return self.engine_cost_policy == "balanced"


@lru_cache
def get_settings() -> Settings:
    return Settings()
