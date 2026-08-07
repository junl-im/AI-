import importlib.util
import shutil

from app.engines.base import TtsEngine
from app.schemas.engine import EngineInfo
from app.schemas.quality import DiagnosticCheck, EngineDiagnostic, QualityDiagnosticsResponse
from app.services.process_metrics import runtime_snapshot


def _status(ok: bool) -> str:
    return "ready" if ok else "missing"


def engine_diagnostic(
    engine: TtsEngine,
    runtime_info: EngineInfo | None = None,
) -> EngineDiagnostic:
    info = runtime_info or engine.info()
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
    if info.health == "probing":
        orchestration_detail = "한 요청만 복구 확인 중이며 다른 요청은 대체 엔진으로 우회합니다."
    elif info.health == "cooldown":
        orchestration_detail = "장애 격리 중이라 자동·고정 선택 요청 모두 실행하지 않습니다."
    elif info.selection_penalty > 0:
        orchestration_detail = (
            info.selection_reason or "최근 실패로 자동 선택 우선순위를 낮췄습니다."
        )
    elif info.recommended:
        orchestration_detail = "현재 자동 생성의 최우선 엔진입니다."
    elif info.auto_eligible:
        orchestration_detail = "실패 시 자동 대체 후보로 대기합니다."
    else:
        orchestration_detail = "테스트 전용 또는 현재 자동 후보가 아닙니다."
    checks.append(
        DiagnosticCheck(
            id="auto-orchestration",
            label="자동 엔진 운영",
            status="ready" if info.recommended and info.health == "ready" else "idle",
            detail=orchestration_detail,
        )
    )
    if info.health == "probing":
        checks.append(
            DiagnosticCheck(
                id="circuit-breaker",
                label="복구 단일 Probe",
                status="idle",
                detail=(
                    "cooldown 종료 후 한 요청만 복구 확인 중입니다. "
                    "다른 자동 요청은 대체 엔진으로 우회합니다."
                ),
            )
        )
    elif info.health == "cooldown":
        checks.append(
            DiagnosticCheck(
                id="circuit-breaker",
                label="장애 격리",
                status="missing",
                detail=(
                    f"연속 실패로 {info.cooldown_remaining_seconds:.1f}초 동안 "
                    "자동·고정 선택 요청에서 제외합니다."
                ),
            )
        )
    elif info.circuit_open_count:
        checks.append(
            DiagnosticCheck(
                id="circuit-breaker",
                label="장애 복구 이력",
                status="ready",
                detail=(
                    f"누적 {info.circuit_open_count}회 격리 이력이 있으며 현재는 "
                    "정상 요청을 받을 수 있습니다."
                ),
            )
        )
    model_loaded: bool | None = None

    if info.id == "melo":
        try:
            package_ready = importlib.util.find_spec("melo") is not None
        except (ImportError, ValueError):
            package_ready = False
        model_loaded = getattr(engine, "_model", None) is not None
        package_detail = (
            "melo.api 모듈을 찾았습니다."
            if package_ready
            else "MeloTTS 선택 설치가 필요합니다."
        )
        model_detail = (
            "모델이 메모리에 로딩되었습니다."
            if model_loaded
            else "첫 생성 요청 때 지연 로딩됩니다."
        )
        checks.extend(
            [
                DiagnosticCheck(
                    id="melo-package",
                    label="MeloTTS 패키지",
                    status=_status(package_ready),
                    detail=package_detail,
                ),
                DiagnosticCheck(
                    id="melo-model",
                    label="한국어 모델",
                    status="ready" if model_loaded else "idle",
                    detail=model_detail,
                ),
            ]
        )
    elif info.id == "system":
        executable = next(
            (
                name
                for name in ("espeak-ng", "espeak", "say", "powershell", "pwsh")
                if shutil.which(name)
            ),
            None,
        )
        executable_detail = (
            f"{executable} 실행 파일을 찾았습니다."
            if executable
            else "지원 음성 도구를 찾지 못했습니다."
        )
        checks.append(
            DiagnosticCheck(
                id="system-executable",
                label="시스템 음성 도구",
                status=_status(executable is not None),
                detail=executable_detail,
            )
        )

    return EngineDiagnostic(
        engine_id=info.id,
        name=info.name,
        mode=info.mode,
        ready=info.ready,
        provider=info.provider,
        quality_tier=info.quality_tier,
        auto_eligible=info.auto_eligible,
        korean_specialization=info.korean_specialization,
        long_form=info.long_form,
        streaming=info.streaming,
        model_loaded=model_loaded,
        recommended=info.recommended,
        health=info.health,
        success_count=info.success_count,
        failure_count=info.failure_count,
        attempt_count=info.attempt_count,
        success_rate=info.success_rate,
        consecutive_failures=info.consecutive_failures,
        cooldown_remaining_seconds=info.cooldown_remaining_seconds,
        circuit_open_count=info.circuit_open_count,
        probe_in_flight=info.probe_in_flight,
        average_latency_ms=info.average_latency_ms,
        last_latency_ms=info.last_latency_ms,
        last_success_at=info.last_success_at,
        last_failure_at=info.last_failure_at,
        selection_penalty=info.selection_penalty,
        degraded_remaining_seconds=info.degraded_remaining_seconds,
        selection_reason=info.selection_reason,
        checks=checks,
    )


def quality_diagnostics(
    version: str,
    engines: list[TtsEngine],
    runtime_info: list[EngineInfo] | None = None,
) -> QualityDiagnosticsResponse:
    runtime = runtime_snapshot()
    info_by_id = {item.id: item for item in runtime_info or []}
    return QualityDiagnosticsResponse(
        version=version,
        python_version=runtime.python_version,
        platform=runtime.platform,
        process_id=runtime.process_id,
        memory_mb=runtime.memory_mb,
        open_file_descriptors=runtime.open_file_descriptors,
        engines=[
            engine_diagnostic(engine, info_by_id.get(engine.info().id))
            for engine in engines
        ],
    )
