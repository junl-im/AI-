import io
import wave
from uuid import uuid4

import pytest

from app.engines.tts.cosyvoice_worker_tts import CosyVoiceWorkerTtsEngine
from app.schemas.engine import EngineInfo
from app.schemas.tts import TtsSynthesisRequest
from app.storage.audio_store import AudioStore


def wav_bytes() -> bytes:
    stream = io.BytesIO()
    with wave.open(stream, "wb") as audio:
        audio.setnchannels(1)
        audio.setsampwidth(2)
        audio.setframerate(24000)
        audio.writeframes(b"\x00\x00" * 2400)
    return stream.getvalue()


class FakeWorker:
    job_timeout_seconds = 2.0

    def info(self) -> EngineInfo:
        return EngineInfo(
            id="cosyvoice3-worker",
            name="worker",
            kind="voiceclone",
            mode="ai",
            provider="test",
            languages=["ko-KR"],
            output_formats=["wav"],
            supports_emotion=True,
            supports_speed=True,
            supports_voice_clone=True,
            ready=True,
        )

    async def create_job(self, profile_id, text, sample_path):
        assert profile_id == "sorion-reference"
        assert sample_path.is_file()
        assert text == "한국어 기준 음색을 확인합니다."
        return {"id": "worker-job", "status": "queued"}

    async def get_job(self, job_id):
        assert job_id == "worker-job"
        return {"id": job_id, "status": "completed"}

    async def download_audio(self, job_id):
        assert job_id == "worker-job"
        return wav_bytes()

    async def cancel_job(self, job_id):
        return {"id": job_id, "status": "cancelled"}


@pytest.mark.asyncio
async def test_cosyvoice_reference_tts_uses_worker(tmp_path):
    sample = tmp_path / "reference.wav"
    sample.write_bytes(wav_bytes())
    engine = CosyVoiceWorkerTtsEngine(
        AudioStore(tmp_path / "audio", 30),
        FakeWorker(),
        str(sample),
        "sorion-reference",
        poll_interval_seconds=0.01,
    )
    request = TtsSynthesisRequest(
        text="한국어 기준 음색을 확인합니다.",
        voice_id="sorion-reference",
        job_id=uuid4(),
    )

    result = await engine.synthesize(request)

    assert result.engine_id == "cosyvoice3"
    assert result.audio_url and result.audio_url.endswith(".wav")
    assert result.file_size_bytes and result.file_size_bytes > 44
    assert engine.info().quality_tier == "reference"
    assert engine.info().korean_specialization == 96


def test_cosyvoice_reference_tts_requires_reference_sample(tmp_path):
    engine = CosyVoiceWorkerTtsEngine(
        AudioStore(tmp_path / "audio", 30),
        FakeWorker(),
        "",
    )

    assert engine.info().ready is False
    assert "REFERENCE_PATH" in (engine.info().reason or "")
