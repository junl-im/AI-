from datetime import datetime, timezone
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


def _gpu_check(diagnostics: dict[str, object]) -> ConnectivityCheck:
    cuda_available = bool(diagnostics.get("cuda_available"))
    gpu_name = str(diagnostics.get("gpu_name") or "CUDA GPU 정보 없음")
    vram = diagnostics.get("vram_total_mb")
    detail = gpu_name
    if isinstance(vram, int):
        detail = f"{gpu_name} · VRAM {vram}MB"
    return ConnectivityCheck(
        id="worker-gpu",
        label="Worker GPU",
        status="ready" if cuda_available else "warning",
        detail=detail if cuda_available else "CUDA GPU가 준비되지 않았습니다.",
    )


@router.get("/connectivity", response_model=ConnectivityResponse)
async def connectivity(request: Request) -> ConnectivityResponse:
    settings = request.app.state.settings
    clone_engines = engine_registry.list_voice_clone()
    for engine in clone_engines:
        await engine.probe()

    orchestrator = getattr(request.app.state, "engine_orchestrator", None)
    tts_infos = (
        orchestrator.list_info()
        if orchestrator is not None
        else [engine.info() for engine in engine_registry.list_tts()]
    )
    clone_infos = [engine.info() for engine in clone_engines]
    real_tts = [
        engine
        for engine in tts_infos
        if engine.ready and engine.mode != "mock" and engine.health == "ready"
    ]
    clone_engine = clone_engines[0] if clone_engines else None
    clone_snapshot = clone_engine.probe_snapshot() if clone_engine else {}
    clone_health = bool(clone_snapshot.get("health_ok"))
    clone_ready = bool(clone_snapshot.get("ready"))
    clone_reason = str(
        clone_snapshot.get("reason") or "복제 Worker가 등록되지 않았습니다."
    )
    clone_latency = clone_snapshot.get("latency_ms")
    raw_diagnostics = clone_snapshot.get("diagnostics")
    diagnostics = raw_diagnostics if isinstance(raw_diagnostics, dict) else {}
    gpu_ready = clone_health and bool(diagnostics.get("cuda_available"))
    gpu_name = diagnostics.get("gpu_name")
    vram_total_mb = diagnostics.get("vram_total_mb")
    checks = [
        ConnectivityCheck(
            id="api",
            label="FastAPI 게이트웨이",
            status="ready",
            detail="모바일 웹 요청을 처리할 수 있습니다.",
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
            detail="Worker /health 응답을 확인했습니다." if clone_health else clone_reason,
            latency_ms=int(clone_latency) if isinstance(clone_latency, int) else None,
        ),
        ConnectivityCheck(
            id="clone-worker-readiness",
            label="CosyVoice 모델 Readiness",
            status="ready" if clone_ready else "warning",
            detail=clone_reason,
            latency_ms=int(clone_latency) if isinstance(clone_latency, int) else None,
        ),
        _gpu_check(diagnostics),
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
        ConnectivityCheck(
            id="private-network",
            label="모바일 사설망 접근",
            status="ready" if settings.allow_private_network else "warning",
            detail=(
                "개발 환경의 Private Network preflight를 허용합니다."
                if settings.allow_private_network
                else "사설망 접근 응답 헤더가 비활성화됐습니다."
            ),
        ),
    ]
    required_ready = all(
        check.status == "ready"
        for check in checks
        if check.id in {"api", "audio-store", "tts-engine", "cors"}
    )
    return ConnectivityResponse(
        version="0.8.6",
        status="ready" if required_ready else "warning",
        environment=settings.environment,
        api_base_path="/api/v1",
        api_ready=True,
        tts_ready=bool(real_tts),
        voice_clone_ready=clone_ready,
        worker_configured=bool(settings.cosyvoice_worker_url),
        worker_healthy=clone_health,
        gpu_ready=gpu_ready,
        gpu_name=str(gpu_name) if gpu_name else None,
        vram_total_mb=(
            int(vram_total_mb) if isinstance(vram_total_mb, int) else None
        ),
        request_id=getattr(request.state, "request_id", None),
        server_time=datetime.now(timezone.utc).isoformat(),
        recommended_recheck_seconds=15 if required_ready else 5,
        cors_origins=settings.cors_origin_list,
        tts_engines=tts_infos,
        voice_clone_engines=clone_infos,
        checks=checks,
    )
