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
    clone_engine = clone_engines[0] if clone_engines else None
    clone_snapshot = clone_engine.probe_snapshot() if clone_engine else {}
    clone_health = bool(clone_snapshot.get("health_ok"))
    clone_ready = bool(clone_snapshot.get("ready"))
    clone_reason = str(
        clone_snapshot.get("reason") or "복제 Worker가 등록되지 않았습니다."
    )
    clone_latency = clone_snapshot.get("latency_ms")
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
            id="clone-worker-health",
            label="CosyVoice Worker 프로세스",
            status="ready" if clone_health else "warning",
            detail=(
                "Worker /health 응답을 확인했습니다."
                if clone_health
                else clone_reason
            ),
            latency_ms=int(clone_latency) if isinstance(clone_latency, int) else None,
        ),
        ConnectivityCheck(
            id="clone-worker-readiness",
            label="CosyVoice 모델 Readiness",
            status="ready" if clone_ready else "warning",
            detail=clone_reason,
            latency_ms=int(clone_latency) if isinstance(clone_latency, int) else None,
        ),
        ConnectivityCheck(
            id="worker-auth",
            label="API ↔ Worker 서명 인증",
            status="ready" if settings.worker_auth_enabled else "warning",
            detail=(
                "서비스 토큰과 HMAC 서명이 활성화됐습니다."
                if settings.worker_auth_enabled
                else "로컬 개발 모드입니다. 공개 배포 전 Worker Secret을 설정하세요."
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
        version="0.7.2",
        status="ready" if required_ready else "warning",
        environment=settings.environment,
        api_base_path="/api/v1",
        cors_origins=settings.cors_origin_list,
        tts_engines=tts_infos,
        voice_clone_engines=clone_infos,
        checks=checks,
    )
