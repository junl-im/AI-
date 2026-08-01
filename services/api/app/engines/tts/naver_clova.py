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

_EMOTIONS = {
    "neutral": "0",
    "sad": "1",
    "happy": "2",
    "angry": "3",
    "calm": "0",
    "commercial": "2",
}


class NaverClovaTtsEngine(TtsEngine):
    endpoint = "https://naveropenapi.apigw.ntruss.com/tts-premium/v1/tts"

    def __init__(
        self,
        store: AudioStore,
        client_id: str,
        client_secret: str,
        speaker: str = "nara",
        timeout_seconds: float = 45.0,
        transport: httpx.AsyncBaseTransport | None = None,
    ) -> None:
        self.store = store
        self.client_id = client_id.strip()
        self.client_secret = client_secret.strip()
        self.speaker = speaker.strip() or "nara"
        self.timeout_seconds = timeout_seconds
        self.transport = transport

    def info(self) -> EngineInfo:
        ready = bool(self.client_id and self.client_secret)
        return EngineInfo(
            id="naver-clova",
            name="NAVER CLOVA Voice Premium",
            kind="tts",
            mode="ai",
            provider="NAVER Cloud",
            languages=["ko-KR"],
            output_formats=["wav"],
            supports_emotion=True,
            supports_speed=True,
            supports_pitch=True,
            supports_voice_clone=False,
            ready=ready,
            reason=None if ready else "NAVER CLOVA Voice 인증 정보가 필요합니다.",
            quality_tier="premium",
            cost_tier="metered",
            korean_specialization=100,
            long_form=True,
        )

    async def synthesize(self, request: TtsSynthesisRequest) -> TtsSynthesisResponse:
        if not self.info().ready:
            raise RuntimeError("NAVER CLOVA Voice 인증 정보가 설정되지 않았습니다.")
        if request.output_format != "wav":
            raise ValueError("NAVER CLOVA Adapter는 현재 WAV만 지원합니다.")
        job_id = UUID(str(request.job_id or uuid4()))
        speed = max(-5, min(5, round((request.speed - 1.0) * 6)))
        pitch = max(-5, min(5, round(request.pitch / 2.4)))
        data = {
            "speaker": self.speaker,
            "volume": "0",
            "speed": str(speed),
            "pitch": str(pitch),
            "emotion": _EMOTIONS[request.emotion],
            "emotion-strength": "2" if request.emotion != "neutral" else "0",
            "format": "wav",
            "text": request.text,
        }
        headers = {
            "X-NCP-APIGW-API-KEY-ID": self.client_id,
            "X-NCP-APIGW-API-KEY": self.client_secret,
            "User-Agent": "SoriON-API/0.9.0",
        }
        async with httpx.AsyncClient(
            transport=self.transport,
            timeout=self.timeout_seconds,
        ) as client:
            response = await client.post(self.endpoint, headers=headers, data=data)
        ensure_success(response, "NAVER CLOVA Voice")
        output_path = write_wave_bytes(self.store, job_id, response.content)
        return cloud_response(
            request.model_copy(update={"job_id": job_id}),
            "naver-clova",
            output_path,
            "한국어 특화 NAVER CLOVA Voice Premium으로 WAV를 생성했습니다.",
        )
