from fastapi import APIRouter

from app.core.config import get_settings
from app.schemas.system import HealthResponse

router = APIRouter()


@router.get("/health", response_model=HealthResponse)
async def health() -> HealthResponse:
    settings = get_settings()
    return HealthResponse(
        status="ok",
        service="sorion-api",
        version="0.5.1",
        default_engine=settings.default_tts_engine,
    )
