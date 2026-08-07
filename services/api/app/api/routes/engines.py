from fastapi import APIRouter, HTTPException, Request, status

from app.engines.registry import engine_registry
from app.schemas.engine import EngineInfo, EngineRuntimeResetResponse
from app.schemas.engine_catalog import EngineCatalogResponse
from app.schemas.engine_strategy import EngineStrategyResponse
from app.services.engine_catalog import current_engine_catalog
from app.services.engine_orchestrator import (
    EngineRefreshError,
    EngineRuntimeBusyError,
    EngineUnavailableError,
)
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


@router.post(
    "/{engine_id}/runtime/reset",
    response_model=EngineRuntimeResetResponse,
)
async def reset_engine_runtime(
    engine_id: str,
    request: Request,
) -> EngineRuntimeResetResponse:
    orchestrator = getattr(request.app.state, "engine_orchestrator", None)
    if orchestrator is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="SOA-4030: 엔진 운영 상태 관리자가 준비되지 않았습니다.",
        )
    try:
        info = await orchestrator.reset_runtime(engine_id)
    except EngineUnavailableError as error:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"SOA-4031: {error}",
        ) from error
    except EngineRuntimeBusyError as error:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"SOA-4032: {error}",
        ) from error
    except EngineRefreshError as error:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"SOA-4033: {error}",
        ) from error
    return EngineRuntimeResetResponse(
        engine_id=engine_id,
        cleared=True,
        message="엔진 장애 격리와 런타임 실패 카운터를 초기화했습니다.",
        engine=info,
    )
