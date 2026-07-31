from app.schemas.engine import EngineInfo


class CosyVoiceCloneEngine:
    def __init__(self, worker_url: str) -> None:
        self.worker_url = worker_url.strip().rstrip("/")

    def info(self) -> EngineInfo:
        configured = bool(self.worker_url)
        ready = False
        return EngineInfo(
            id="cosyvoice3-worker",
            name="Fun-CosyVoice 3 Worker",
            kind="voiceclone",
            mode="ai",
            provider="FunAudioLLM",
            languages=["ko", "en", "ja", "zh", "de", "es", "fr", "it", "ru"],
            output_formats=["wav"],
            supports_emotion=True,
            supports_speed=True,
            supports_pitch=False,
            supports_voice_clone=True,
            ready=ready,
            reason=(
                "Worker URL은 설정됐지만 0.6.0에서는 health 확인 전 준비 완료로 표시하지 않습니다."
                if configured
                else "SORION_COSYVOICE_WORKER_URL을 설정하면 별도 모델 Worker와 연결됩니다."
            ),
        )
