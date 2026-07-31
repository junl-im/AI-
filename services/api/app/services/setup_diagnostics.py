import os
import shutil
import sys
from pathlib import Path

from app.core.config import Settings
from app.engines.base import TtsEngine
from app.schemas.setup import SetupStatusResponse, SetupStep


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


def setup_status(version: str, settings: Settings, engines: list[TtsEngine]) -> SetupStatusResponse:
    real_engines = [engine.info() for engine in engines if engine.info().mode != "mock"]
    ready_real = [engine for engine in real_engines if engine.ready]
    python_ready = sys.version_info >= (3, 10)
    ffmpeg = shutil.which("ffmpeg")
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
            status="ready" if settings.environment in {"development", "production"} else "warning",
            required=False,
            detail=f"{settings.environment} · PID {os.getpid()}",
        ),
    ]
    required_ready = all(step.status == "ready" for step in steps if step.required)
    return SetupStatusResponse(
        version=version,
        ready=required_ready,
        real_engine_count=len(ready_real),
        steps=steps,
    )
