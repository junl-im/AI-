from fastapi import APIRouter

from app.api.routes import engines, health, tts

api_router = APIRouter()
api_router.include_router(health.router, tags=["system"])
api_router.include_router(engines.router, prefix="/engines", tags=["engines"])
api_router.include_router(tts.router, prefix="/tts", tags=["tts"])
