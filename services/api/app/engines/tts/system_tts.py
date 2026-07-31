import asyncio
import platform
import shutil
import subprocess
import wave
from dataclasses import dataclass
from pathlib import Path
from uuid import UUID, uuid4

from app.engines.base import TtsEngine
from app.schemas.engine import EngineInfo
from app.schemas.tts import TtsSynthesisRequest, TtsSynthesisResponse
from app.storage.audio_store import AudioStore


@dataclass(frozen=True)
class SystemBackend:
    kind: str
    executable: str
    voice: str


class SystemSpeechAdapter:
    def __init__(self, configured_voice: str = "") -> None:
        self.backend = self._detect(configured_voice)
        self.reason = None if self.backend else self._unavailable_reason()

    @staticmethod
    def _unavailable_reason() -> str:
        return "한국어 시스템 음성 도구를 찾지 못했습니다. Windows 음성, macOS say 또는 eSpeak를 설치해 주세요."

    def _detect(self, configured_voice: str) -> SystemBackend | None:
        system = platform.system().lower()
        if system == "windows":
            executable = shutil.which("powershell") or shutil.which("pwsh")
            if executable:
                return SystemBackend("windows", executable, configured_voice)
        if system == "darwin":
            say = shutil.which("say")
            afconvert = shutil.which("afconvert")
            if say and afconvert:
                return SystemBackend("macos", say, configured_voice or "Yuna")
        executable = shutil.which("espeak-ng") or shutil.which("espeak")
        if executable and self._has_korean_espeak_voice(executable):
            return SystemBackend("espeak", executable, configured_voice or "ko")
        return None

    @staticmethod
    def _has_korean_espeak_voice(executable: str) -> bool:
        try:
            result = subprocess.run(
                [executable, "--voices=ko"],
                check=False,
                capture_output=True,
                text=True,
                timeout=3,
            )
            return " ko " in f" {result.stdout.lower()} " or "korean" in result.stdout.lower()
        except (OSError, subprocess.SubprocessError):
            return False

    async def synthesize(self, request: TtsSynthesisRequest, output_path: Path) -> None:
        if self.backend is None:
            raise RuntimeError(self.reason or "시스템 음성 엔진을 사용할 수 없습니다.")
        if self.backend.kind == "windows":
            await self._windows(request, output_path)
        elif self.backend.kind == "macos":
            await self._macos(request, output_path)
        else:
            await self._espeak(request, output_path)
        self._validate_wave(output_path)

    async def _espeak(self, request: TtsSynthesisRequest, output_path: Path) -> None:
        assert self.backend is not None
        speed = max(80, min(360, round(175 * request.speed)))
        pitch = max(0, min(99, 50 + request.pitch * 3))
        command = [
            self.backend.executable,
            "-v",
            self.backend.voice,
            "-s",
            str(speed),
            "-p",
            str(pitch),
            "-w",
            str(output_path),
            request.text,
        ]
        await self._run(command)

    async def _macos(self, request: TtsSynthesisRequest, output_path: Path) -> None:
        assert self.backend is not None
        aiff_path = output_path.with_suffix(".aiff")
        words_per_minute = max(90, min(360, round(180 * request.speed)))
        try:
            await self._run([
                self.backend.executable,
                "-v",
                self.backend.voice,
                "-r",
                str(words_per_minute),
                "-o",
                str(aiff_path),
                request.text,
            ])
            await self._run([
                shutil.which("afconvert") or "afconvert",
                "-f",
                "WAVE",
                "-d",
                "LEI16@22050",
                str(aiff_path),
                str(output_path),
            ])
        finally:
            aiff_path.unlink(missing_ok=True)

    async def _windows(self, request: TtsSynthesisRequest, output_path: Path) -> None:
        assert self.backend is not None
        script = Path(__file__).with_name("scripts") / "windows_speech.ps1"
        text_path = output_path.with_suffix(".txt")
        text_path.write_text(request.text, encoding="utf-8")
        rate = max(-10, min(10, round((request.speed - 1) * 8)))
        try:
            await self._run([
                self.backend.executable,
                "-NoProfile",
                "-NonInteractive",
                "-ExecutionPolicy",
                "Bypass",
                "-File",
                str(script),
                "-TextPath",
                str(text_path),
                "-OutputPath",
                str(output_path),
                "-Rate",
                str(rate),
                "-VoiceName",
                self.backend.voice,
            ])
        finally:
            text_path.unlink(missing_ok=True)

    @staticmethod
    async def _run(command: list[str]) -> None:
        process = await asyncio.create_subprocess_exec(
            *command,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        try:
            _, stderr = await process.communicate()
        except asyncio.CancelledError:
            process.terminate()
            await process.wait()
            raise
        if process.returncode != 0:
            message = stderr.decode("utf-8", errors="replace").strip()
            raise RuntimeError(message or "시스템 음성 도구 실행에 실패했습니다.")

    @staticmethod
    def _validate_wave(output_path: Path) -> None:
        if not output_path.is_file() or output_path.stat().st_size <= 44:
            raise RuntimeError("시스템 음성 도구가 유효한 WAV 파일을 만들지 못했습니다.")
        with output_path.open("rb") as stream:
            header = stream.read(12)
            if len(header) < 12 or header[:4] != b"RIFF" or header[8:12] != b"WAVE":
                raise RuntimeError("생성 결과가 WAV 형식이 아닙니다.")


class SystemTtsEngine(TtsEngine):
    def __init__(self, store: AudioStore, configured_voice: str = "") -> None:
        self.store = store
        self.adapter = SystemSpeechAdapter(configured_voice)

    def info(self) -> EngineInfo:
        backend = self.adapter.backend
        return EngineInfo(
            id="system",
            name="SoriON Local Korean Voice",
            kind="tts",
            mode="local",
            provider=backend.kind if backend else "operating-system",
            languages=["ko-KR"],
            output_formats=["wav"],
            supports_emotion=False,
            supports_speed=True,
            supports_pitch=bool(backend and backend.kind == "espeak"),
            supports_voice_clone=False,
            ready=backend is not None,
            reason=self.adapter.reason,
        )

    async def synthesize(self, request: TtsSynthesisRequest) -> TtsSynthesisResponse:
        if request.output_format != "wav":
            raise ValueError("시스템 음성 파일럿은 현재 WAV만 지원합니다.")
        if self.adapter.backend is None:
            raise RuntimeError(self.adapter.reason or "시스템 음성 엔진을 사용할 수 없습니다.")

        job_id = request.job_id or uuid4()
        output_path = self.store.output_path(UUID(str(job_id)), "wav")
        try:
            await self.adapter.synthesize(request, output_path)
            duration = self._duration(output_path)
        except BaseException:
            self.store.remove(output_path)
            raise

        return TtsSynthesisResponse(
            job_id=str(job_id),
            status="completed",
            engine_id="system",
            engine_mode="local",
            audio_url=f"/api/v1/audio/{output_path.name}",
            estimated_duration_seconds=round(duration, 1),
            message="기기에 설치된 한국어 시스템 음성으로 WAV를 생성했습니다. AI 모델 음성은 아닙니다.",
        )

    @staticmethod
    def _duration(path: Path) -> float:
        with wave.open(str(path), "rb") as audio:
            return audio.getnframes() / max(1, audio.getframerate())
