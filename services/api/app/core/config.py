from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    environment: str = "development"
    cors_origins: str = (
        "http://localhost:5173,http://127.0.0.1:5173,"
        "https://junl-im.github.io"
    )
    default_tts_engine: str = "auto"
    allow_mock_engine: bool = True
    enable_melo_tts: bool = True
    melo_device: str = "auto"
    enable_system_tts: bool = True
    system_tts_voice: str = ""
    generation_timeout_seconds: float = 75.0
    max_concurrent_generations: int = 1
    audio_ttl_minutes: int = 30
    max_segment_chars: int = 180
    audio_directory: str = ".sorion/audio"
    voice_clone_directory: str = ".sorion/voice-clones"
    voice_clone_ttl_days: int = 7
    voice_clone_max_file_bytes: int = 25 * 1024 * 1024
    cosyvoice_worker_url: str = ""
    cosyvoice_worker_timeout_seconds: float = 2.5

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
    def voice_clone_path(self) -> Path:
        return Path(self.voice_clone_directory).expanduser().resolve()


@lru_cache
def get_settings() -> Settings:
    return Settings()
