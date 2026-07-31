import importlib.util
import shutil

from app.engines.base import TtsEngine
from app.schemas.quality import DiagnosticCheck, EngineDiagnostic, QualityDiagnosticsResponse
from app.services.process_metrics import runtime_snapshot


def _status(ok: bool) -> str:
    return "ready" if ok else "missing"


def engine_diagnostic(engine: TtsEngine) -> EngineDiagnostic:
    info = engine.info()
    checks = [
        DiagnosticCheck(
            id="registered",
            label="엔진 등록",
            status="ready",
            detail="SoriON 엔진 레지스트리에 등록되어 있습니다.",
        ),
        DiagnosticCheck(
            id="runtime-ready",
            label="실행 준비",
            status=_status(info.ready),
            detail=info.reason or "현재 환경에서 음성 생성을 시작할 수 있습니다.",
        ),
    ]
    model_loaded: bool | None = None

    if info.id == "melo":
        try:
            package_ready = importlib.util.find_spec("melo") is not None
        except (ImportError, ValueError):
            package_ready = False
        model_loaded = getattr(engine, "_model", None) is not None
        checks.extend([
            DiagnosticCheck(
                id="melo-package",
                label="MeloTTS 패키지",
                status=_status(package_ready),
                detail="melo.api 모듈을 찾았습니다." if package_ready else "MeloTTS 선택 설치가 필요합니다.",
            ),
            DiagnosticCheck(
                id="melo-model",
                label="한국어 모델",
                status="ready" if model_loaded else "idle",
                detail="모델이 메모리에 로딩되었습니다." if model_loaded else "첫 생성 요청 때 지연 로딩됩니다.",
            ),
        ])
    elif info.id == "system":
        executable = next(
            (name for name in ("espeak-ng", "espeak", "say", "powershell", "pwsh") if shutil.which(name)),
            None,
        )
        checks.append(DiagnosticCheck(
            id="system-executable",
            label="시스템 음성 도구",
            status=_status(executable is not None),
            detail=f"{executable} 실행 파일을 찾았습니다." if executable else "지원 음성 도구를 찾지 못했습니다.",
        ))

    return EngineDiagnostic(
        engine_id=info.id,
        name=info.name,
        mode=info.mode,
        ready=info.ready,
        provider=info.provider,
        model_loaded=model_loaded,
        checks=checks,
    )


def quality_diagnostics(version: str, engines: list[TtsEngine]) -> QualityDiagnosticsResponse:
    runtime = runtime_snapshot()
    return QualityDiagnosticsResponse(
        version=version,
        python_version=runtime.python_version,
        platform=runtime.platform,
        process_id=runtime.process_id,
        memory_mb=runtime.memory_mb,
        engines=[engine_diagnostic(engine) for engine in engines],
    )
