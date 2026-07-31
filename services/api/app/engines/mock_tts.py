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
            languages=["ko-KR"],
            supports_emotion=True,
            supports_voice_clone=False,
            ready=True,
        )

    async def synthesize(self, request: TtsSynthesisRequest) -> TtsSynthesisResponse:
        estimated_duration = max(1.0, len(request.text.strip()) / (5.2 * request.speed))
        return TtsSynthesisResponse(
            job_id=str(uuid4()),
            status="mock-complete",
            engine_id="mock",
            audio_url=None,
            estimated_duration_seconds=round(estimated_duration, 1),
            message="웹과 AI API 연결을 확인했습니다. 실제 음원은 Phase 2 엔진 연결 후 생성됩니다.",
        )
