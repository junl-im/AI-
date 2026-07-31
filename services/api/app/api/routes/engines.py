from fastapi import APIRouter

from app.engines.registry import engine_registry
from app.schemas.engine import EngineInfo

router = APIRouter()


@router.get("", response_model=list[EngineInfo])
async def list_engines() -> list[EngineInfo]:
    return [engine.info() for engine in engine_registry.list_tts()]
