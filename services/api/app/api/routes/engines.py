from fastapi import APIRouter, Request

from app.engines.registry import engine_registry
from app.schemas.engine import EngineInfo
from app.schemas.engine_catalog import EngineCatalogResponse
from app.schemas.engine_strategy import EngineStrategyResponse
from app.services.engine_catalog import current_engine_catalog
from app.services.engine_strategy import current_engine_strategy
from app.version import APP_VERSION

router = APIRouter()


@router.get("/strategy", response_model=EngineStrategyResponse)
async def engine_strategy(request: Request) -> EngineStrategyResponse:
    return current_engine_strategy(APP_VERSION)


@router.get("/catalog", response_model=EngineCatalogResponse)
async def engine_catalog() -> EngineCatalogResponse:
    return current_engine_catalog(APP_VERSION)


@router.get("", response_model=list[EngineInfo])
async def list_engines(request: Request) -> list[EngineInfo]:
    orchestrator = getattr(request.app.state, "engine_orchestrator", None)
    if orchestrator is None:
        return [engine.info() for engine in engine_registry.list_tts()]
    return orchestrator.list_info()
