import asyncio
import platform
import re
import shutil
import subprocess
import wave
from dataclasses import dataclass
from pathlib import Path
from uuid import UUID, uuid4

from app.engines.base import TtsEngine
from app.schemas.engine import EngineInfo
from app.schemas.tts import TtsSynthesisRequest, TtsSynthesisResponse
from app.services.voice_presets import (
    VoicePresetProfile,
    VoicePresetUnavailableError,
    get_voice_preset,
    list_voice_presets,
)
from app.storage.audio_store import AudioStore


@dataclass(frozen=True)
class SystemBackend:
    kind: str
    executable: str
    voice: str


_FEMALE_NAME_TOKENS = (
    "female",
    "woman",
    "girl",
    "여성",
    "여자",
    "sunhi",
    "yuna",
    "heami",
    "seoyeon",
    "sora",
    "samantha",
    "zira",
)
_MALE_NAME_TOKENS = (
    "male",
    "man",
    "boy",
    "남성",
    "남자",
    "injoon",
    "hyunsu",
    "minsu",
    "bongjin",
    "yong",
    "youngho",
    "david",
    "mark",
    "daniel",
)


class SystemSpeechAdapter:
    def __init__(self, configured_voice: str = "") -> None:
        self.configured_voice = configured_voice.strip()
        self.backends: list[SystemBackend] = []
        self.backend: SystemBackend | None = None
        self.reason: str | None = None
        self.refresh()

    def refresh(self) -> None:
        self.backends = self._detect_backends(self.configured_voice)
        self.backend = self.backends[0] if self.backends else None
        self.reason = None if self.backend else self._unavailable_reason()

    @staticmethod
    def _unavailable_reason() -> str:
        return (
            "한국어 시스템 음성 도구를 찾지 못했습니다. "
            "Windows 음성, macOS say 또는 eSpeak를 설치해 주세요."
        )

    @staticmethod
    def _espeak_voice_name(configured_voice: str) -> str:
        value = configured_voice.strip().lower()
        return configured_voice if value == "ko" or value.startswith("ko+") else "ko"

    def _detect_backends(self, configured_voice: str) -> list[SystemBackend]:
        backends: list[SystemBackend] = []
        system = platform.system().lower()
        if system == "windows":
            executable = shutil.which("powershell") or shutil.which("pwsh")
            if executable and self._has_windows_korean_voice(executable, configured_voice):
                backends.append(SystemBackend("windows", executable, configured_voice))
        elif system == "darwin":
            say = shutil.which("say")
            afconvert = shutil.which("afconvert")
            if say and afconvert:
                backends.append(SystemBackend("macos", say, configured_voice))

        executable = shutil.which("espeak-ng") or shutil.which("espeak")
        if executable and self._has_korean_espeak_voice(executable):
            backends.append(
                SystemBackend(
                    "espeak",
                    executable,
                    self._espeak_voice_name(configured_voice),
                )
            )
        return backends

    def _available_backends(self) -> list[SystemBackend]:
        backends = getattr(self, "backends", None)
        if backends is not None:
            return list(backends)
        backend = getattr(self, "backend", None)
        return [backend] if backend is not None else []

    @staticmethod
    def _windows_voice_inventory(executable: str) -> list[dict[str, str]]:
        command = (
            "Add-Type -AssemblyName System.Speech; "
            "$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer; "
            "$synth.GetInstalledVoices() | Where-Object { $_.Enabled } | "
            "ForEach-Object { Write-Output ($_.VoiceInfo.Name + '|' + "
            "$_.VoiceInfo.Culture.Name + '|' + $_.VoiceInfo.Gender.ToString()) }; "
            "$synth.Dispose()"
        )
        try:
            result = subprocess.run(
                [executable, "-NoProfile", "-NonInteractive", "-Command", command],
                check=False,
                capture_output=True,
                text=True,
                timeout=5,
            )
        except (OSError, subprocess.SubprocessError):
            return []
        if result.returncode != 0:
            return []
        voices: list[dict[str, str]] = []
        for line in result.stdout.splitlines():
            parts = [part.strip() for part in line.strip().split("|")]
            if len(parts) < 2:
                continue
            voices.append({
                "name": parts[0],
                "culture": parts[1],
                "gender": parts[2].lower() if len(parts) > 2 else "unknown",
            })
        return voices

    @classmethod
    def _has_windows_korean_voice(cls, executable: str, configured_voice: str) -> bool:
        voices = cls._windows_voice_inventory(executable)
        if configured_voice:
            return any(
                item["name"] == configured_voice
                and item["culture"].lower().startswith("ko-")
                for item in voices
            )
        return any(item["culture"].lower().startswith("ko-") for item in voices)

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

    @staticmethod
    def _identity_has_token(identity: str, token: str) -> bool:
        if token in {"female", "male", "woman", "man", "girl", "boy"}:
            return re.search(rf"(?<![a-z]){re.escape(token)}(?![a-z])", identity) is not None
        return token in identity

    @classmethod
    def _infer_voice_gender(cls, name: str) -> str:
        identity = name.lower()
        female = any(cls._identity_has_token(identity, token) for token in _FEMALE_NAME_TOKENS)
        male = any(cls._identity_has_token(identity, token) for token in _MALE_NAME_TOKENS)
        if female and not male:
            return "female"
        if male and not female:
            return "male"
        return "unknown"

    @staticmethod
    def _macos_korean_voices(executable: str) -> list[str]:
        try:
            result = subprocess.run(
                [executable, "-v", "?"],
                check=False,
                capture_output=True,
                text=True,
                timeout=5,
            )
        except (OSError, subprocess.SubprocessError):
            return []
        if result.returncode != 0:
            return []
        voices: list[str] = []
        for line in result.stdout.splitlines():
            match = re.match(r"^(.+?)\s+ko(?:_|-)KR\s+#", line.strip(), re.IGNORECASE)
            if match:
                voices.append(match.group(1).strip())
        return voices

    def _macos_voice_for(
        self,
        preset: VoicePresetProfile,
        backend: SystemBackend | None = None,
    ) -> str:
        resolved = backend or self.backend
        assert resolved is not None
        voices = self._macos_korean_voices(resolved.executable)
        if resolved.voice:
            if resolved.voice not in voices:
                raise VoicePresetUnavailableError(
                    f"설정한 macOS 한국어 음성 '{resolved.voice}'을 찾지 못했습니다."
                )
            candidates = [resolved.voice]
        else:
            candidates = voices
        if not candidates:
            raise VoicePresetUnavailableError("설치된 macOS 한국어 음성을 찾지 못했습니다.")

        candidates = [
            voice
            for voice in candidates
            if (
                self._infer_voice_gender(voice) == preset.gender
                if preset.requires_gender_match
                else self._infer_voice_gender(voice) == "unknown"
            )
        ]
        if not candidates:
            label = (
                "남성" if preset.gender == "male"
                else "여성" if preset.gender == "female"
                else "중성"
            )
            raise VoicePresetUnavailableError(
                f"{preset.display_name} 프리셋에 필요한 {label} macOS 한국어 음성이 없습니다. "
                "다른 성별 또는 정체가 다른 음성으로 자동 대체하지 않습니다."
            )

        preferred = next(
            (
                voice
                for voice in candidates
                if any(token in voice.lower() for token in preset.preferred_voice_tokens)
            ),
            None,
        )
        if preferred:
            return preferred
        return candidates[preset.variant_index % len(candidates)]

    def _espeak_voice_for(
        self,
        preset: VoicePresetProfile,
        backend: SystemBackend | None = None,
    ) -> str:
        resolved = backend or self.backend
        assert resolved is not None
        base = resolved.voice.split("+", maxsplit=1)[0] or "ko"
        if preset.gender == "male":
            return f"{base}+m{(preset.variant_index % 7) + 1}"
        if preset.gender == "female":
            return f"{base}+f{(preset.variant_index % 4) + 1}"
        return base

    @staticmethod
    def _gender_label(value: str) -> str:
        return {"female": "여성", "male": "남성", "neutral": "중성"}.get(value, "미확인")

    def _windows_selection_for(
        self,
        preset: VoicePresetProfile,
        backend: SystemBackend | None = None,
    ) -> dict[str, str | None]:
        resolved = backend or self.backend
        assert resolved is not None
        inventory = [
            item
            for item in self._windows_voice_inventory(resolved.executable)
            if item["culture"].lower().startswith("ko-")
        ]
        expected = preset.gender
        compatible = [
            item for item in inventory
            if (
                item["gender"] == expected
                if preset.requires_gender_match
                else item["gender"] in {"neutral", "notset", "unknown"}
            )
        ]
        if resolved.voice:
            compatible = [item for item in compatible if item["name"] == resolved.voice]
        preferred = next((
            item for item in compatible
            if any(token in item["name"].lower() for token in preset.preferred_voice_tokens)
        ), None)
        if preferred is not None:
            selected = preferred
            basis = "preferred-name"
        elif compatible:
            selected = compatible[preset.variant_index % len(compatible)]
            basis = (
                f"gender-slot-{preset.variant_index + 1}"
                if len(compatible) > preset.variant_index
                else "same-gender-cycle"
            )
        else:
            raise VoicePresetUnavailableError(
                f"설치된 {self._gender_label(expected)} Windows 한국어 음성이 없습니다."
            )
        return {
            "selected_voice_id": selected["name"],
            "selected_voice_name": selected["name"],
            "selected_gender": selected["gender"],
            "selection_basis": basis,
        }

    def selection_diagnostics(self) -> list[dict[str, object]]:
        results: list[dict[str, object]] = []
        backends = self._available_backends()
        for preset in list_voice_presets():
            base: dict[str, object] = {
                "engine_id": "system",
                "engine_name": "SoriON Local Korean Voice",
                "voice_id": preset.id,
                "display_name": preset.display_name,
                "expected_gender": preset.gender,
                "status": "missing",
                "selected_voice_id": None,
                "selected_voice_name": None,
                "selected_gender": None,
                "selection_basis": "unavailable",
                "reason": self.reason or "시스템 음성 엔진을 사용할 수 없습니다.",
            }
            if not backends:
                results.append(base)
                continue
            errors: list[str] = []
            for index, backend in enumerate(backends):
                try:
                    if backend.kind == "windows":
                        selected = self._windows_selection_for(preset, backend)
                    elif backend.kind == "macos":
                        name = self._macos_voice_for(preset, backend)
                        selected = {
                            "selected_voice_id": name,
                            "selected_voice_name": name,
                            "selected_gender": self._infer_voice_gender(name),
                            "selection_basis": "macos-inventory",
                        }
                    else:
                        name = self._espeak_voice_for(preset, backend)
                        selected = {
                            "selected_voice_id": name,
                            "selected_voice_name": name,
                            "selected_gender": preset.gender,
                            "selection_basis": "espeak-gender-variant",
                        }
                    if index > 0:
                        selected["selection_basis"] = (
                            f"fallback-{backend.kind}:{selected['selection_basis']}"
                        )
                    base.update(selected)
                    base["status"] = "ready"
                    base["reason"] = (
                        "기본 시스템 음성이 프리셋과 맞지 않아 보조 로컬 백엔드로 전환했습니다."
                        if index > 0
                        else "현재 기기에서 선택될 실제 시스템 화자입니다."
                    )
                    break
                except VoicePresetUnavailableError as error:
                    errors.append(f"{backend.kind}: {error}")
            else:
                base["status"] = "blocked"
                base["reason"] = "; ".join(errors)
            results.append(base)
        return results

    async def synthesize(self, request: TtsSynthesisRequest, output_path: Path) -> None:
        backends = self._available_backends()
        if not backends:
            raise RuntimeError(self.reason or "시스템 음성 엔진을 사용할 수 없습니다.")

        preset_errors: list[str] = []
        runtime_errors: list[str] = []
        for backend in backends:
            output_path.unlink(missing_ok=True)
            try:
                if backend.kind == "windows":
                    await self._windows(request, output_path, backend)
                elif backend.kind == "macos":
                    await self._macos(request, output_path, backend)
                else:
                    await self._espeak(request, output_path, backend)
                self._validate_wave(output_path)
                return
            except VoicePresetUnavailableError as error:
                preset_errors.append(f"{backend.kind}: {error}")
            except RuntimeError as error:
                runtime_errors.append(f"{backend.kind}: {error}")

        if preset_errors and not runtime_errors:
            raise VoicePresetUnavailableError("; ".join(preset_errors))
        detail = "; ".join([*preset_errors, *runtime_errors])
        raise RuntimeError(detail or "시스템 음성 백엔드를 모두 시도했지만 생성하지 못했습니다.")

    async def _espeak(
        self,
        request: TtsSynthesisRequest,
        output_path: Path,
        backend: SystemBackend | None = None,
    ) -> None:
        resolved = backend or self.backend
        assert resolved is not None
        preset = get_voice_preset(request.voice_id)
        speed = max(80, min(360, round(175 * request.speed * preset.rate_multiplier)))
        pitch = max(0, min(99, round(50 + (request.pitch + preset.pitch_offset) * 3)))
        command = [
            resolved.executable,
            "-v",
            self._espeak_voice_for(preset, resolved),
            "-s",
            str(speed),
            "-p",
            str(pitch),
            "-w",
            str(output_path),
            request.text,
        ]
        await self._run(command)

    async def _macos(
        self,
        request: TtsSynthesisRequest,
        output_path: Path,
        backend: SystemBackend | None = None,
    ) -> None:
        resolved = backend or self.backend
        assert resolved is not None
        aiff_path = output_path.with_suffix(".aiff")
        preset = get_voice_preset(request.voice_id)
        selected_voice = self._macos_voice_for(preset, resolved)
        words_per_minute = max(
            90,
            min(360, round(180 * request.speed * preset.rate_multiplier)),
        )
        try:
            await self._run([
                resolved.executable,
                "-v",
                selected_voice,
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

    async def _windows(
        self,
        request: TtsSynthesisRequest,
        output_path: Path,
        backend: SystemBackend | None = None,
    ) -> None:
        resolved = backend or self.backend
        assert resolved is not None
        script = Path(__file__).with_name("scripts") / "windows_speech.ps1"
        text_path = output_path.with_suffix(".txt")
        text_path.write_text(request.text, encoding="utf-8")
        preset = get_voice_preset(request.voice_id)
        effective_speed = request.speed * preset.rate_multiplier
        rate = max(-10, min(10, round((effective_speed - 1) * 8)))
        try:
            try:
                await self._run([
                    resolved.executable,
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
                    resolved.voice,
                    "-VoicePreset",
                    preset.id,
                    "-ExpectedGender",
                    preset.gender,
                ])
            except RuntimeError as error:
                marker = "VOICE_PRESET_UNAVAILABLE:"
                message = str(error)
                if marker in message:
                    detail = message.split(marker, maxsplit=1)[1].strip()
                    raise VoicePresetUnavailableError(detail) from error
                raise
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
        backends = self.adapter._available_backends()
        return EngineInfo(
            id="system",
            name="SoriON Local Korean Voice",
            kind="tts",
            mode="local",
            provider="+".join(item.kind for item in backends) if backends else "operating-system",
            languages=["ko-KR"],
            output_formats=["wav"],
            supports_emotion=False,
            supports_speed=True,
            supports_pitch=any(item.kind == "espeak" for item in backends),
            supports_voice_clone=False,
            ready=backend is not None,
            reason=self.adapter.reason,
            quality_tier="basic",
            korean_specialization=45,
            long_form=True,
        )

    def voice_selection_diagnostics(self) -> list[dict[str, object]]:
        return self.adapter.selection_diagnostics()

    def refresh_runtime(self) -> None:
        self.adapter.refresh()

    async def synthesize(self, request: TtsSynthesisRequest) -> TtsSynthesisResponse:
        if request.output_format != "wav":
            raise ValueError("시스템 음성 파일럿은 현재 WAV만 지원합니다.")
        if self.adapter.backend is None:
            raise RuntimeError(self.adapter.reason or "시스템 음성 엔진을 사용할 수 없습니다.")

        preset = get_voice_preset(request.voice_id)
        job_id = request.job_id or uuid4()
        output_path = self.store.output_path(UUID(str(job_id)), "wav")
        try:
            await self.adapter.synthesize(request, output_path)
            duration = self._duration(output_path)
        except BaseException:
            self.store.remove(output_path)
            raise

        gender_label = {"male": "남성", "female": "여성", "neutral": "중성"}[preset.gender]
        return TtsSynthesisResponse(
            job_id=str(job_id),
            status="completed",
            engine_id="system",
            engine_mode="local",
            audio_url=f"/api/v1/audio/{output_path.name}",
            estimated_duration_seconds=round(duration, 1),
            message=(
                f"{preset.display_name}({gender_label}) 프리셋과 호환되는 "
                "기기 한국어 음성을 적용했습니다. "
                "반대 성별 자동 대체는 차단되며, 전용 AI 화자와는 다른 시스템 근사 음성입니다."
            ),
        )

    @staticmethod
    def _duration(path: Path) -> float:
        with wave.open(str(path), "rb") as audio:
            return audio.getnframes() / max(1, audio.getframerate())
