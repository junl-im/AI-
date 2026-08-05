import hashlib
import io
import json
import wave
from uuid import uuid4

import pytest

from app.engines.tts.cosyvoice_worker_tts import CosyVoiceWorkerTtsEngine
from app.schemas.engine import EngineInfo
from app.schemas.tts import TtsSynthesisRequest
from app.services.voice_presets import VoicePresetUnavailableError, get_voice_preset
from app.storage.audio_store import AudioStore


def wav_bytes() -> bytes:
    stream = io.BytesIO()
    with wave.open(stream, "wb") as audio:
        audio.setnchannels(1)
        audio.setsampwidth(2)
        audio.setframerate(24000)
        audio.writeframes(b"\xe8\x03" * 28800)
    return stream.getvalue()


def write_approved_manifest(directory, voice_id):
    preset = get_voice_preset(voice_id)
    wav_path = directory / f"{voice_id}.wav"
    payload = {
        "schema_version": 2,
        "voice_id": voice_id,
        "display_name": preset.display_name,
        "declared_gender": preset.gender,
        "reference_file": wav_path.name,
        "consent": {
            "status": "confirmed",
            "subject_reference": f"test:{voice_id}",
            "evidence_reference": f"consent:{voice_id}",
            "consented_at": "2026-08-05T00:00:00Z",
            "expires_at": None,
            "notes": "test",
        },
        "rights": {
            "source_type": "self-recorded",
            "source_reference": f"recording:{voice_id}",
            "allowed_uses": ["tts-inference"],
            "commercial_use": False,
            "redistribution": False,
            "training_use": False,
            "expires_at": None,
            "notes": "test",
        },
        "integrity": {
            "sha256": hashlib.sha256(wav_path.read_bytes()).hexdigest(),
            "file_size_bytes": wav_path.stat().st_size,
        },
        "human_review": {
            "status": "approved",
            "reviewer": "tester",
            "reviewed_at": "2026-08-05T00:10:00Z",
            "sample_text": "공통 검수 문장",
            "audio_sha256": hashlib.sha256(wav_path.read_bytes()).hexdigest(),
            "source_review_bundle_sha256": "",
            "notes": "test",
        },
    }
    (directory / f"{voice_id}.manifest.json").write_text(
        json.dumps(payload, ensure_ascii=False),
        encoding="utf-8",
    )


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
@pytest.mark.parametrize(
    ("voice_id", "voice_name"),
    [
        ("on-clear", "도윤"),
        ("jun-deep", "준호"),
        ("min-energetic", "민준"),
    ],
)
async def test_cosyvoice_uses_voice_id_named_preset_reference(
    tmp_path, voice_id, voice_name
):
    preset_directory = tmp_path / "presets"
    preset_directory.mkdir()
    preset = preset_directory / f"{voice_id}.wav"
    preset.write_bytes(wav_bytes())
    write_approved_manifest(preset_directory, voice_id)
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
            text=f"{voice_name} 프리셋 기준 음색을 확인합니다.",
            voice_id=voice_id,
            job_id=uuid4(),
        )
    )

    assert worker.profile_id == f"sorion-reference-{voice_id}"
    assert worker.sample_path == preset.resolve()
    assert f"{voice_id} 전용" in result.message


@pytest.mark.asyncio
async def test_cosyvoice_does_not_fallback_missing_preset_to_default_reference(tmp_path):
    sample = tmp_path / "reference.wav"
    sample.write_bytes(wav_bytes())
    preset_directory = tmp_path / "presets"
    preset_directory.mkdir()
    engine = CosyVoiceWorkerTtsEngine(
        AudioStore(tmp_path / "audio", 30),
        FakeWorker(),
        str(sample),
        "sorion-reference",
        poll_interval_seconds=0.01,
        preset_directory=str(preset_directory),
    )

    with pytest.raises(VoicePresetUnavailableError, match="자동 대체하지 않습니다"):
        await engine.synthesize(
            TtsSynthesisRequest(
                text="누락 프리셋은 기본 여성 음성으로 대체되면 안 됩니다.",
                voice_id="on-clear",
                job_id=uuid4(),
            )
        )


@pytest.mark.asyncio
async def test_cosyvoice_rejects_wav_without_approved_manifest(tmp_path):
    preset_directory = tmp_path / "presets"
    preset_directory.mkdir()
    (preset_directory / "on-clear.wav").write_bytes(wav_bytes())
    sample = tmp_path / "reference.wav"
    sample.write_bytes(wav_bytes())
    engine = CosyVoiceWorkerTtsEngine(
        AudioStore(tmp_path / "audio", 30),
        FakeWorker(),
        str(sample),
        "sorion-reference",
        poll_interval_seconds=0.01,
        preset_directory=str(preset_directory),
    )

    with pytest.raises(VoicePresetUnavailableError, match="manifest"):
        await engine.synthesize(
            TtsSynthesisRequest(
                text="미인증 전용 음성은 사용하면 안 됩니다.",
                voice_id="on-clear",
                job_id=uuid4(),
            )
        )

@pytest.mark.asyncio
async def test_cosyvoice_rejects_same_wav_registered_for_multiple_presets(tmp_path):
    preset_directory = tmp_path / "presets"
    preset_directory.mkdir()
    duplicated = wav_bytes()
    for voice_id in ("on-clear", "jun-deep"):
        (preset_directory / f"{voice_id}.wav").write_bytes(duplicated)
        write_approved_manifest(preset_directory, voice_id)
    sample = tmp_path / "reference.wav"
    sample.write_bytes(wav_bytes())
    engine = CosyVoiceWorkerTtsEngine(
        AudioStore(tmp_path / "audio", 30),
        FakeWorker(),
        str(sample),
        "sorion-reference",
        poll_interval_seconds=0.01,
        preset_directory=str(preset_directory),
    )

    with pytest.raises(VoicePresetUnavailableError, match="중복 등록"):
        await engine.synthesize(
            TtsSynthesisRequest(
                text="같은 사람의 음성을 여러 인물 프리셋에 등록하면 안 됩니다.",
                voice_id="on-clear",
                job_id=uuid4(),
            )
        )
