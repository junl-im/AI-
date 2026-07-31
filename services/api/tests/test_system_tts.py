import shutil
import wave
from uuid import uuid4

import pytest

from app.core.config import Settings
from app.engines.tts.system_tts import SystemTtsEngine
from app.schemas.tts import TtsSynthesisRequest
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
