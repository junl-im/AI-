from pathlib import Path

from fastapi import APIRouter, Request

from app.engines.registry import engine_registry
from app.schemas.connectivity import ConnectivityCheck, ConnectivityResponse

router = APIRouter()


def _directory_check(path: Path) -> ConnectivityCheck:
    try:
        path.mkdir(parents=True, exist_ok=True)
        probe = path / ".connectivity-probe"
        probe.write_text("ok", encoding="utf-8")
        probe.unlink(missing_ok=True)
        return ConnectivityCheck(
            id="audio-store",
            label="임시 음원 저장소",
            status="ready",
            detail=f"WAV를 저장할 수 있습니다: {path}",
        )
    except OSError as error:
        return ConnectivityCheck(
            id="audio-store",
            label="임시 음원 저장소",
            status="missing",
            detail=f"임시 음원 폴더에 쓸 수 없습니다: {error}",
        )


@router.get("/connectivity", response_model=ConnectivityResponse)
async def connectivity(request: Request) -> ConnectivityResponse:
    settings = request.app.state.settings
    clone_engines = engine_registry.list_voice_clone()
    for engine in clone_engines:
        await engine.probe()

    tts_infos = [engine.info() for engine in engine_registry.list_tts()]
    clone_infos = [engine.info() for engine in clone_engines]
    real_tts = [engine for engine in tts_infos if engine.ready and engine.mode != "mock"]
    clone_ready = [engine for engine in clone_infos if engine.ready]
    checks = [
        ConnectivityCheck(
            id="api",
            label="FastAPI 게이트웨이",
            status="ready",
            detail="웹 요청을 처리할 수 있습니다.",
        ),
        _directory_check(settings.audio_path),
        ConnectivityCheck(
            id="tts-engine",
            label="실제 한국어 TTS",
            status="ready" if real_tts else "missing",
            detail=(
                ", ".join(engine.name for engine in real_tts)
                if real_tts
                else "Mock 외에 실행 가능한 한국어 TTS 엔진이 없습니다."
            ),
        ),
        ConnectivityCheck(
            id="clone-worker",
            label="CosyVoice Worker",
            status="ready" if clone_ready else "warning",
            detail=(
                ", ".join(engine.name for engine in clone_ready)
                if clone_ready
                else (
                    clone_infos[0].reason
                    if clone_infos
                    else "복제 Worker가 등록되지 않았습니다."
                )
            ),
        ),
        ConnectivityCheck(
            id="cors",
            label="웹 CORS 허용",
            status="ready" if settings.cors_origin_list else "missing",
            detail=", ".join(settings.cors_origin_list) or "허용 Origin이 비어 있습니다.",
        ),
    ]
    required_ready = all(
        check.status == "ready"
        for check in checks
        if check.id in {"api", "audio-store", "tts-engine", "cors"}
    )
    return ConnectivityResponse(
        version="0.6.4",
        status="ready" if required_ready else "warning",
        environment=settings.environment,
        api_base_path="/api/v1",
        cors_origins=settings.cors_origin_list,
        tts_engines=tts_infos,
        voice_clone_engines=clone_infos,
        checks=checks,
    )
