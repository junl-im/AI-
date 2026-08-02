import os
import shutil
import sys
from pathlib import Path

from app.core.config import Settings
from app.engines.base import TtsEngine
from app.schemas.setup import SetupStatusResponse, SetupStep

PRESET_VOICE_IDS = ("sori-warm", "on-clear", "dam-calm")


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
            detail=f"WAV 파일을 저장할 수 있습니다: {path}",
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


def _voice_preset_check(path: Path | None) -> tuple[SetupStep, int]:
    if path is None:
        return (
            SetupStep(
                id="voice-presets",
                label="CosyVoice 프리셋 음색",
                status="warning",
                required=False,
                detail="프리셋 폴더가 연결되지 않았습니다. 0/3 준비",
                action=(
                    "START_ENGINE.cmd로 실행하거나 "
                    "SORION_COSYVOICE_PRESET_DIRECTORY를 설정하세요."
                ),
            ),
            0,
        )
    ready_ids = [
        voice_id for voice_id in PRESET_VOICE_IDS
        if (path / f"{voice_id}.wav").is_file()
    ]
    missing_ids = [voice_id for voice_id in PRESET_VOICE_IDS if voice_id not in ready_ids]
    ready_count = len(ready_ids)
    if ready_count == len(PRESET_VOICE_IDS):
        return (
            SetupStep(
                id="voice-presets",
                label="CosyVoice 프리셋 음색",
                status="ready",
                required=False,
                detail=f"3/3 준비 · {path}",
            ),
            ready_count,
        )
    detail = f"{ready_count}/3 준비 · 누락: {', '.join(missing_ids)} · {path}"
    return (
        SetupStep(
            id="voice-presets",
            label="CosyVoice 프리셋 음색",
            status="warning",
            required=False,
            detail=detail,
            action="동의받은 WAV를 voice-presets 폴더에 지정된 이름으로 추가하세요.",
        ),
        ready_count,
    )


def setup_status(version: str, settings: Settings, engines: list[TtsEngine]) -> SetupStatusResponse:
    real_engines = [engine.info() for engine in engines if engine.info().mode != "mock"]
    ready_real = [engine for engine in real_engines if engine.ready]
    python_ready = sys.version_info >= (3, 10)
    ffmpeg = shutil.which("ffmpeg")
    preset_step, preset_ready_count = _voice_preset_check(
        settings.cosyvoice_preset_path
    )
    steps = [
        SetupStep(
            id="python",
            label="Python 3.10 이상",
            status="ready" if python_ready else "missing",
            required=True,
            detail=sys.version.split()[0],
            action=None if python_ready else "Python 3.10 이상을 설치하세요.",
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
        steps=steps,
    )
