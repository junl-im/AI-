from fastapi import APIRouter

from app.core.config import get_settings
from app.engines.registry import engine_registry
from app.schemas.setup import SetupStatusResponse
from app.services.setup_diagnostics import setup_status

router = APIRouter()


@router.get("", response_model=SetupStatusResponse)
async def get_setup_status() -> SetupStatusResponse:
    return setup_status("0.9.1", get_settings(), engine_registry.list_tts())
