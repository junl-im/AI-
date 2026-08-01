from uuid import uuid4

from app.engines.base import TtsEngine
from app.schemas.engine import EngineInfo
from app.schemas.tts import TtsSynthesisRequest, TtsSynthesisResponse


class MockTtsEngine(TtsEngine):
    def info(self) -> EngineInfo:
        return EngineInfo(
            id="mock",
            name="SoriON Development Mock",
            kind="tts",
            mode="mock",
            provider="SoriON",
            languages=["ko-KR"],
            output_formats=["wav"],
            supports_emotion=True,
            supports_speed=True,
            supports_pitch=True,
            supports_voice_clone=False,
            ready=True,
            reason="기능 계약 검증용이며 사람의 음성을 생성하지 않습니다.",
            quality_tier="basic",
            korean_specialization=0,
        )

    async def synthesize(self, request: TtsSynthesisRequest) -> TtsSynthesisResponse:
        estimated_duration = max(1.0, len(request.text.strip()) / (5.2 * request.speed))
        return TtsSynthesisResponse(
            job_id=str(request.job_id or uuid4()),
            status="mock-complete",
            engine_id="mock",
            engine_mode="mock",
            audio_url=None,
            estimated_duration_seconds=round(estimated_duration, 1),
            message="Mock 엔진 계약을 확인했습니다. 웹에서 기능 검증용 데모 WAV를 준비합니다.",
        )
