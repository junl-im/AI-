from fastapi import APIRouter

from app.schemas.director import DirectorPlanResponse, DirectorRequest
from app.services.ai_director import build_director_plan
from app.version import APP_VERSION

router = APIRouter()


@router.post("/plan", response_model=DirectorPlanResponse)
async def plan_voice_project(request: DirectorRequest) -> DirectorPlanResponse:
    return build_director_plan(request, APP_VERSION)
