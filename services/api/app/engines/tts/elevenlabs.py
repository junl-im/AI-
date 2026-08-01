from uuid import UUID, uuid4

import httpx

from app.engines.base import TtsEngine
from app.engines.tts.cloud_common import (
    cloud_response,
    ensure_success,
    write_pcm16_wave,
)
from app.schemas.engine import EngineInfo
from app.schemas.tts import TtsSynthesisRequest, TtsSynthesisResponse
from app.storage.audio_store import AudioStore

_EMOTION_TAGS = {
    "neutral": "",
    "happy": "[cheerful] ",
    "calm": "[calm] ",
    "sad": "[sad] ",
    "angry": "[angry] ",
    "commercial": "[confident] ",
}


class ElevenLabsTtsEngine(TtsEngine):
    def __init__(
        self,
        store: AudioStore,
        api_key: str,
        voice_id: str,
        model_id: str = "eleven_v3",
        timeout_seconds: float = 60.0,
        transport: httpx.AsyncBaseTransport | None = None,
    ) -> None:
        self.store = store
        self.api_key = api_key.strip()
        self.voice_id = voice_id.strip()
        self.model_id = model_id.strip() or "eleven_v3"
        self.timeout_seconds = timeout_seconds
        self.transport = transport

    @property
    def endpoint(self) -> str:
        return f"https://api.elevenlabs.io/v1/text-to-speech/{self.voice_id}"

    def info(self) -> EngineInfo:
        ready = bool(self.api_key and self.voice_id)
        v3 = self.model_id == "eleven_v3"
        return EngineInfo(
            id="elevenlabs-v3",
            name="ElevenLabs Korean Premium",
            kind="tts",
            mode="ai",
            provider="ElevenLabs",
            languages=["ko-KR"],
            output_formats=["wav"],
            supports_emotion=True,
            supports_speed=not v3,
            supports_pitch=False,
            supports_voice_clone=False,
            ready=ready,
            reason=None if ready else "ElevenLabs API key와 한국어 voice ID가 필요합니다.",
            quality_tier="premium",
            korean_specialization=75,
            long_form=True,
            streaming=False,
        )

    async def synthesize(self, request: TtsSynthesisRequest) -> TtsSynthesisResponse:
        if not self.info().ready:
            raise RuntimeError("ElevenLabs 인증 정보가 설정되지 않았습니다.")
        if request.output_format != "wav":
            raise ValueError("ElevenLabs Adapter는 현재 WAV만 지원합니다.")
        job_id = UUID(str(request.job_id or uuid4()))
        text = f"{_EMOTION_TAGS[request.emotion]}{request.text}".strip()
        payload: dict[str, object] = {
            "text": text,
            "model_id": self.model_id,
            "language_code": "ko",
            "apply_text_normalization": "on",
        }
        if self.model_id != "eleven_v3":
            payload["voice_settings"] = {
                "stability": 0.52,
                "similarity_boost": 0.78,
                "style": 0.0,
                "use_speaker_boost": True,
                "speed": max(0.7, min(1.2, request.speed)),
            }
        async with httpx.AsyncClient(
            transport=self.transport,
            timeout=self.timeout_seconds,
        ) as client:
            response = await client.post(
                self.endpoint,
                params={"output_format": "pcm_24000"},
                headers={
                    "xi-api-key": self.api_key,
                    "Content-Type": "application/json",
                    "User-Agent": "SoriON-API/0.8.9",
                },
                json=payload,
            )
        ensure_success(response, "ElevenLabs")
        output_path = write_pcm16_wave(self.store, job_id, response.content, 24000)
        return cloud_response(
            request.model_copy(update={"job_id": job_id}),
            "elevenlabs-v3",
            output_path,
            "ElevenLabs 고감정 한국어 모델로 WAV를 생성했습니다.",
        )
