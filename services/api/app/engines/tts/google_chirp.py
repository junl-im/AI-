import base64
from uuid import UUID, uuid4

import httpx

from app.engines.base import TtsEngine
from app.engines.tts.cloud_common import (
    CloudTtsError,
    cloud_response,
    ensure_success,
    write_wave_bytes,
)
from app.schemas.engine import EngineInfo
from app.schemas.tts import TtsSynthesisRequest, TtsSynthesisResponse
from app.storage.audio_store import AudioStore


class GoogleChirpTtsEngine(TtsEngine):
    endpoint = "https://texttospeech.googleapis.com/v1/text:synthesize"

    def __init__(
        self,
        store: AudioStore,
        api_key: str,
        voice_name: str = "ko-KR-Chirp3-HD-Aoede",
        timeout_seconds: float = 45.0,
        transport: httpx.AsyncBaseTransport | None = None,
    ) -> None:
        self.store = store
        self.api_key = api_key.strip()
        self.voice_name = voice_name.strip() or "ko-KR-Chirp3-HD-Aoede"
        self.timeout_seconds = timeout_seconds
        self.transport = transport

    def info(self) -> EngineInfo:
        ready = bool(self.api_key)
        return EngineInfo(
            id="google-chirp3-hd",
            name="Google Chirp 3 HD Korean",
            kind="tts",
            mode="ai",
            provider="Google Cloud",
            languages=["ko-KR"],
            output_formats=["wav"],
            supports_emotion=False,
            supports_speed=False,
            supports_pitch=False,
            supports_voice_clone=False,
            ready=ready,
            reason=None if ready else "Google Cloud TTS API key가 필요합니다.",
            quality_tier="premium",
            korean_specialization=90,
            long_form=True,
            streaming=False,
        )

    async def synthesize(self, request: TtsSynthesisRequest) -> TtsSynthesisResponse:
        if not self.info().ready:
            raise RuntimeError("Google Cloud TTS API key가 설정되지 않았습니다.")
        if request.output_format != "wav":
            raise ValueError("Google Chirp 3 HD Adapter는 현재 WAV만 지원합니다.")
        job_id = UUID(str(request.job_id or uuid4()))
        payload = {
            "input": {"text": request.text},
            "voice": {
                "languageCode": "ko-KR",
                "name": self.voice_name,
            },
            "audioConfig": {
                "audioEncoding": "LINEAR16",
            },
        }
        async with httpx.AsyncClient(
            transport=self.transport,
            timeout=self.timeout_seconds,
        ) as client:
            response = await client.post(
                self.endpoint,
                params={"key": self.api_key},
                json=payload,
                headers={"User-Agent": "SoriON-API/0.8.9"},
            )
        ensure_success(response, "Google Chirp 3 HD")
        try:
            audio_content = response.json()["audioContent"]
            content = base64.b64decode(audio_content, validate=True)
        except (KeyError, TypeError, ValueError) as error:
            raise CloudTtsError("Google Cloud 응답에 유효한 audioContent가 없습니다.") from error
        output_path = write_wave_bytes(self.store, job_id, content)
        return cloud_response(
            request.model_copy(update={"job_id": job_id}),
            "google-chirp3-hd",
            output_path,
            "Google Chirp 3 HD 한국어 생성 모델로 WAV를 생성했습니다.",
        )
