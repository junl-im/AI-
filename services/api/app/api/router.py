from fastapi import APIRouter

from app.api.routes import (
    audio,
    connectivity,
    director,
    engines,
    evidence,
    exports,
    health,
    quality,
    setup,
    tts,
    verification,
    voice_clones,
    voice_preset_approvals,
)

api_router = APIRouter()
api_router.include_router(health.router, tags=["system"])
api_router.include_router(connectivity.router, tags=["system"])
api_router.include_router(engines.router, prefix="/engines", tags=["engines"])
api_router.include_router(director.router, prefix="/director", tags=["director"])
api_router.include_router(tts.router, prefix="/tts", tags=["tts"])
api_router.include_router(quality.router, prefix="/quality", tags=["quality"])
api_router.include_router(verification.router, prefix="/quality", tags=["quality"])
api_router.include_router(voice_preset_approvals.router, prefix="/quality", tags=["quality"])
api_router.include_router(evidence.router, prefix="/quality", tags=["quality"])
api_router.include_router(exports.router, prefix="/exports", tags=["exports"])
api_router.include_router(setup.router, prefix="/setup", tags=["setup"])
api_router.include_router(audio.router, prefix="/audio", tags=["audio"])
api_router.include_router(
    voice_clones.router,
    prefix="/voice-clones",
    tags=["voice-clones"],
)
