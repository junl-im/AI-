from fastapi import APIRouter

from app.api.routes import audio, connectivity, engines, health, quality, setup, tts, voice_clones

api_router = APIRouter()
api_router.include_router(health.router, tags=["system"])
api_router.include_router(connectivity.router, tags=["system"])
api_router.include_router(engines.router, prefix="/engines", tags=["engines"])
api_router.include_router(tts.router, prefix="/tts", tags=["tts"])
api_router.include_router(quality.router, prefix="/quality", tags=["quality"])
api_router.include_router(setup.router, prefix="/setup", tags=["setup"])
api_router.include_router(audio.router, prefix="/audio", tags=["audio"])
api_router.include_router(
    voice_clones.router,
    prefix="/voice-clones",
    tags=["voice-clones"],
)
