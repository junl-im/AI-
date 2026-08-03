import os
import shutil
import sys
from pathlib import Path

from app.core.config import Settings
from app.engines.base import TtsEngine
from app.schemas.setup import SetupStatusResponse, SetupStep, VoicePresetDiagnostic
from app.services.voice_preset_validation import inspect_voice_preset
from app.services.voice_presets import PRESET_VOICE_IDS


def _audio_directory_check(path: Path) -> SetupStep:
    try:
        path.mkdir(parents=True, exist_ok=True)
        probe = path / ".write-probe"
        probe.write_text("ok", encoding="utf-8")
        probe.unlink(missing_ok=True)
        return SetupStep(
            id="audio-directory",
            label="임시 음원 폴더",
            status="ready",
            required=True,
            detail="WAV 파일을 저장할 수 있습니다.",
        )
    except OSError as error:
        return SetupStep(
            id="audio-directory",
            label="임시 음원 폴더",
            status="missing",
            required=True,
            detail=f"폴더에 쓸 수 없습니다: {error}",
            action="SORION_AUDIO_DIRECTORY를 쓰기 가능한 경로로 변경하세요.",
        )


def _voice_preset_check(
    path: Path | None,
) -> tuple[SetupStep, int, list[VoicePresetDiagnostic]]:
    if path is None:
        diagnostics = [
            VoicePresetDiagnostic(
                voice_id=voice_id,
                filename=f"{voice_id}.wav",
                status="missing",
                usable=False,
                issues=["프리셋 폴더가 연결되지 않았습니다."],
            )
            for voice_id in PRESET_VOICE_IDS
        ]
        return (
            SetupStep(
                id="voice-presets",
                label="CosyVoice 프리셋 음색",
                status="warning",
                required=False,
                detail=f"프리셋 폴더가 연결되지 않았습니다. 0/{len(PRESET_VOICE_IDS)} 사용 가능",
                action=(
                    "START_ENGINE.cmd로 실행하거나 "
                    "SORION_COSYVOICE_PRESET_DIRECTORY를 설정하세요."
                ),
            ),
            0,
            diagnostics,
        )

    inspections = [
        inspect_voice_preset(path / f"{voice_id}.wav", voice_id)
        for voice_id in PRESET_VOICE_IDS
    ]
    diagnostics = [
        VoicePresetDiagnostic(
            voice_id=item.voice_id,
            filename=item.filename,
            status=item.status,
            usable=item.usable,
            duration_seconds=item.duration_seconds,
            sample_rate=item.sample_rate,
            channel_count=item.channel_count,
            sample_width_bits=item.sample_width_bits,
            silence_ratio=item.silence_ratio,
            clipping_ratio=item.clipping_ratio,
            issues=list(item.issues),
        )
        for item in inspections
    ]
    ready_count = sum(1 for item in inspections if item.usable)
    blocked = [item.voice_id for item in inspections if item.status == "blocked"]
    missing = [item.voice_id for item in inspections if item.status == "missing"]
    warnings = [item.voice_id for item in inspections if item.status == "warning"]
    if ready_count == len(PRESET_VOICE_IDS) and not warnings:
        detail = (
            f"{len(PRESET_VOICE_IDS)}/{len(PRESET_VOICE_IDS)} 사용 가능 · "
            "포맷·길이·샘플레이트·무음·클리핑 검사 통과"
        )
        status = "ready"
        action = None
    else:
        parts = [f"{ready_count}/{len(PRESET_VOICE_IDS)} 사용 가능"]
        if missing:
            parts.append(f"누락: {', '.join(missing)}")
        if blocked:
            parts.append(f"차단: {', '.join(blocked)}")
        if warnings:
            parts.append(f"품질 경고: {', '.join(warnings)}")
        detail = " · ".join(parts)
        status = "warning"
        action = "각 WAV 진단을 확인한 뒤 동의받은 기준 음성을 교체하세요."
    return (
        SetupStep(
            id="voice-presets",
            label="CosyVoice 프리셋 음색",
            status=status,
            required=False,
            detail=detail,
            action=action,
        ),
        ready_count,
        diagnostics,
    )


def setup_status(version: str, settings: Settings, engines: list[TtsEngine]) -> SetupStatusResponse:
    real_engines = [engine.info() for engine in engines if engine.info().mode != "mock"]
    ready_real = [engine for engine in real_engines if engine.ready]
    python_ready = sys.version_info >= (3, 10) and sys.version_info < (3, 13)
    ffmpeg = shutil.which("ffmpeg")
    preset_step, preset_ready_count, preset_diagnostics = _voice_preset_check(
        settings.cosyvoice_preset_path
    )
    steps = [
        SetupStep(
            id="python",
            label="Python 3.10 이상 · 지원 상한 3.12",
            status="ready" if python_ready else "missing",
            required=True,
            detail=sys.version.split()[0],
            action=None if python_ready else "Python 3.10~3.12를 설치하세요.",
        ),
        _audio_directory_check(settings.audio_path),
        SetupStep(
            id="real-engine",
            label="실제 한국어 음성 엔진",
            status="ready" if ready_real else "missing",
            required=True,
            detail=(
                ", ".join(engine.name for engine in ready_real)
                if ready_real
                else "MeloTTS 또는 한국어 시스템 음성을 찾지 못했습니다."
            ),
            action=(
                None
                if ready_real
                else "docs/ENGINE_PILOT.md의 운영체제별 설치 절차를 진행하세요."
            ),
        ),
        preset_step,
        SetupStep(
            id="ffmpeg",
            label="FFmpeg 변환 도구",
            status="ready" if ffmpeg else "warning",
            required=False,
            detail=ffmpeg or "설치되지 않았습니다. WAV 생성에는 필요하지 않습니다.",
            action=None if ffmpeg else "MP3·FLAC 변환이 필요할 때 FFmpeg를 설치하세요.",
        ),
        SetupStep(
            id="cors",
            label="웹 연결 허용 주소",
            status="ready" if settings.cors_origin_list else "warning",
            required=True,
            detail=", ".join(settings.cors_origin_list) or "허용 주소가 비어 있습니다.",
            action="배포 주소를 SORION_CORS_ORIGINS에 추가하세요.",
        ),
        SetupStep(
            id="environment",
            label="실행 환경",
            status=(
                "ready"
                if settings.environment in {"development", "production"}
                else "warning"
            ),
            required=False,
            detail=f"{settings.environment} · PID {os.getpid()}",
        ),
    ]
    required_ready = all(step.status == "ready" for step in steps if step.required)
    return SetupStatusResponse(
        version=version,
        ready=required_ready,
        real_engine_count=len(ready_real),
        voice_preset_ready_count=preset_ready_count,
        voice_preset_expected_count=len(PRESET_VOICE_IDS),
        voice_preset_diagnostics=preset_diagnostics,
        steps=steps,
    )
