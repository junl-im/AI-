from fastapi import APIRouter

from app.core.config import get_settings
from app.schemas.system import HealthResponse
from app.version import APP_VERSION

router = APIRouter()


@router.get("/health", response_model=HealthResponse)
async def health() -> HealthResponse:
    settings = get_settings()
    return HealthResponse(
        status="ok",
        service="sorion-api",
        version=APP_VERSION,
        default_engine=settings.default_tts_engine,
    )
