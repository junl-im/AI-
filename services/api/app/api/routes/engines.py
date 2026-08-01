from fastapi import APIRouter

from app.engines.registry import engine_registry
from app.schemas.engine import EngineInfo
from app.schemas.engine_strategy import EngineStrategyResponse
from app.services.engine_strategy import current_engine_strategy

router = APIRouter()


@router.get("/strategy", response_model=EngineStrategyResponse)
async def engine_strategy() -> EngineStrategyResponse:
    return current_engine_strategy("0.8.1")


@router.get("", response_model=list[EngineInfo])
async def list_engines() -> list[EngineInfo]:
    return [engine.info() for engine in engine_registry.list_tts()]
