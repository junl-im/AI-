import shutil
import wave
from uuid import uuid4

import pytest

from app.core.config import Settings
from app.engines.tts.system_tts import SystemSpeechAdapter, SystemTtsEngine
from app.schemas.tts import TtsSynthesisRequest
from app.services.voice_presets import VoicePresetUnavailableError
from app.storage.audio_store import AudioStore


@pytest.mark.asyncio
async def test_system_tts_creates_real_wave_when_espeak_is_available(tmp_path):
    if not (shutil.which("espeak-ng") or shutil.which("espeak")):
        pytest.skip("eSpeak is not installed")

    store = AudioStore(tmp_path, ttl_minutes=30)
    engine = SystemTtsEngine(store)
    if not engine.info().ready:
        pytest.skip("Korean eSpeak voice is not installed")

    job_id = uuid4()
    result = await engine.synthesize(
        TtsSynthesisRequest(
            text="안녕하세요. 소리온 로컬 음성 테스트입니다.",
            voice_id="sori-warm",
            output_format="wav",
            job_id=job_id,
        )
    )

    path = store.output_path(job_id)
    assert result.status == "completed"
    assert result.engine_mode == "local"
    assert path.stat().st_size > 44
    with wave.open(str(path), "rb") as audio:
        assert audio.getnframes() > 0


def test_settings_resolves_audio_directory(tmp_path, monkeypatch):
    monkeypatch.chdir(tmp_path)
    settings = Settings(audio_directory=".audio")
    assert settings.audio_path == (tmp_path / ".audio").resolve()


def test_windows_backend_requires_an_installed_korean_voice(monkeypatch):
    monkeypatch.setattr(
        "app.engines.tts.system_tts.platform.system",
        lambda: "Windows",
    )
    monkeypatch.setattr(
        "app.engines.tts.system_tts.shutil.which",
        lambda name: "powershell.exe" if name == "powershell" else None,
    )

    class Result:
        returncode = 0
        stdout = "Microsoft David Desktop|en-US\n"

    monkeypatch.setattr(
        "app.engines.tts.system_tts.subprocess.run",
        lambda *args, **kwargs: Result(),
    )

    adapter = SystemSpeechAdapter()

    assert adapter.backend is None
    assert "한국어 시스템 음성 도구" in (adapter.reason or "")


def test_windows_backend_accepts_korean_voice(monkeypatch):
    monkeypatch.setattr(
        "app.engines.tts.system_tts.platform.system",
        lambda: "Windows",
    )
    monkeypatch.setattr(
        "app.engines.tts.system_tts.shutil.which",
        lambda name: "powershell.exe" if name == "powershell" else None,
    )

    class Result:
        returncode = 0
        stdout = "Microsoft Heami Desktop|ko-KR\n"

    monkeypatch.setattr(
        "app.engines.tts.system_tts.subprocess.run",
        lambda *args, **kwargs: Result(),
    )

    adapter = SystemSpeechAdapter()

    assert adapter.backend is not None
    assert adapter.backend.kind == "windows"


def test_espeak_uses_gendered_variants_without_cross_gender_fallback():
    adapter = object.__new__(SystemSpeechAdapter)
    adapter.backend = type("Backend", (), {"voice": "ko"})()

    from app.services.voice_presets import get_voice_preset

    assert adapter._espeak_voice_for(get_voice_preset("sori-warm")).startswith("ko+f")
    assert adapter._espeak_voice_for(get_voice_preset("on-clear")).startswith("ko+m")
    assert adapter._espeak_voice_for(get_voice_preset("jun-deep")) != adapter._espeak_voice_for(
        get_voice_preset("on-clear")
    )

@pytest.mark.asyncio
async def test_windows_preset_marker_becomes_non_circuit_error(tmp_path, monkeypatch):
    adapter = object.__new__(SystemSpeechAdapter)
    adapter.backend = type(
        "Backend",
        (),
        {"kind": "windows", "executable": "powershell.exe", "voice": ""},
    )()

    async def reject(_command):
        raise RuntimeError(
            "PowerShell error: VOICE_PRESET_UNAVAILABLE: "
            "남성 한국어 음성이 부족합니다."
        )

    monkeypatch.setattr(adapter, "_run", reject)
    request = TtsSynthesisRequest(
        text="Windows 프리셋 오류 변환 테스트입니다.",
        voice_id="jun-deep",
        job_id=uuid4(),
    )

    with pytest.raises(VoicePresetUnavailableError, match="남성 한국어 음성이 부족"):
        await adapter._windows(request, tmp_path / "result.wav")
