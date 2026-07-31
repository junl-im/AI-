from fastapi import APIRouter, HTTPException, status

from app.core.config import get_settings
from app.engines.registry import engine_registry
from app.schemas.tts import TtsSynthesisRequest, TtsSynthesisResponse

router = APIRouter()


@router.post("/synthesize", response_model=TtsSynthesisResponse)
async def synthesize(request: TtsSynthesisRequest) -> TtsSynthesisResponse:
    engine_id = request.engine_id or get_settings().default_tts_engine
    engine = engine_registry.get_tts(engine_id)
    if engine is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"SOA-4001: '{engine_id}' 음성 엔진을 사용할 수 없습니다.",
        )
    return await engine.synthesize(request)
