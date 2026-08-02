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
        audio.writeframes(b"\xe8\x03" * 28800)
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


class PresetWorker(FakeWorker):
    def __init__(self):
        self.profile_id = ""
        self.sample_path = None

    async def create_job(self, profile_id, text, sample_path):
        self.profile_id = profile_id
        self.sample_path = sample_path
        return {"id": "worker-job", "status": "queued"}


@pytest.mark.asyncio
async def test_cosyvoice_uses_voice_id_named_preset_reference(tmp_path):
    preset_directory = tmp_path / "presets"
    preset_directory.mkdir()
    preset = preset_directory / "on-clear.wav"
    preset.write_bytes(wav_bytes())
    worker = PresetWorker()
    engine = CosyVoiceWorkerTtsEngine(
        AudioStore(tmp_path / "audio", 30),
        worker,
        "",
        "sorion-reference",
        poll_interval_seconds=0.01,
        preset_directory=str(preset_directory),
    )

    result = await engine.synthesize(
        TtsSynthesisRequest(
            text="도윤 프리셋 기준 음색을 확인합니다.",
            voice_id="on-clear",
            job_id=uuid4(),
        )
    )

    assert worker.profile_id == "sorion-reference-on-clear"
    assert worker.sample_path == preset.resolve()
    assert "on-clear 전용" in result.message
