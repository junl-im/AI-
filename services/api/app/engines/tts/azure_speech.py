from html import escape
from uuid import UUID, uuid4

import httpx

from app.engines.base import TtsEngine
from app.engines.tts.cloud_common import (
    cloud_response,
    ensure_success,
    write_wave_bytes,
)
from app.schemas.engine import EngineInfo
from app.schemas.tts import TtsSynthesisRequest, TtsSynthesisResponse
from app.storage.audio_store import AudioStore


class AzureSpeechTtsEngine(TtsEngine):
    def __init__(
        self,
        store: AudioStore,
        subscription_key: str,
        region: str,
        voice_name: str = "ko-KR-SunHiNeural",
        timeout_seconds: float = 45.0,
        transport: httpx.AsyncBaseTransport | None = None,
    ) -> None:
        self.store = store
        self.subscription_key = subscription_key.strip()
        self.region = region.strip()
        self.voice_name = voice_name.strip() or "ko-KR-SunHiNeural"
        self.timeout_seconds = timeout_seconds
        self.transport = transport

    @property
    def endpoint(self) -> str:
        return f"https://{self.region}.tts.speech.microsoft.com/cognitiveservices/v1"

    def info(self) -> EngineInfo:
        ready = bool(self.subscription_key and self.region)
        return EngineInfo(
            id="azure-speech",
            name="Azure Korean Neural Voice",
            kind="tts",
            mode="ai",
            provider="Microsoft Azure",
            languages=["ko-KR"],
            output_formats=["wav"],
            supports_emotion=False,
            supports_speed=True,
            supports_pitch=True,
            supports_voice_clone=False,
            ready=ready,
            reason=None if ready else "Azure Speech key와 region이 필요합니다.",
            quality_tier="premium",
            korean_specialization=85,
            long_form=True,
        )

    async def synthesize(self, request: TtsSynthesisRequest) -> TtsSynthesisResponse:
        if not self.info().ready:
            raise RuntimeError("Azure Speech 인증 정보가 설정되지 않았습니다.")
        if request.output_format != "wav":
            raise ValueError("Azure Speech Adapter는 현재 WAV만 지원합니다.")
        job_id = UUID(str(request.job_id or uuid4()))
        rate = round((request.speed - 1.0) * 100)
        pitch = request.pitch
        ssml = (
            '<speak version="1.0" xml:lang="ko-KR" '
            'xmlns="http://www.w3.org/2001/10/synthesis">'
            f'<voice name="{escape(self.voice_name)}">'
            f'<prosody rate="{rate:+d}%" pitch="{pitch:+d}st">'
            f"{escape(request.text)}"
            "</prosody></voice></speak>"
        )
        headers = {
            "Ocp-Apim-Subscription-Key": self.subscription_key,
            "Content-Type": "application/ssml+xml",
            "X-Microsoft-OutputFormat": "riff-24khz-16bit-mono-pcm",
            "User-Agent": "SoriON-API/0.8.9",
        }
        async with httpx.AsyncClient(
            transport=self.transport,
            timeout=self.timeout_seconds,
        ) as client:
            response = await client.post(self.endpoint, headers=headers, content=ssml.encode())
        ensure_success(response, "Azure Speech")
        output_path = write_wave_bytes(self.store, job_id, response.content)
        return cloud_response(
            request.model_copy(update={"job_id": job_id}),
            "azure-speech",
            output_path,
            "Azure 한국어 Neural Voice로 WAV를 생성했습니다.",
        )
