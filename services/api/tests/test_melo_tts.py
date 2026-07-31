import wave
from types import SimpleNamespace
from uuid import uuid4

import pytest

from app.engines.tts.melo_tts import MeloTtsEngine
from app.schemas.tts import TtsSynthesisRequest
from app.storage.audio_store import AudioStore


class FakeMeloModel:
    hps = SimpleNamespace(data=SimpleNamespace(spk2id={"KR": 0}))

    def tts_to_file(self, text, speaker_id, output_path, speed):
        assert text
        assert speaker_id == 0
        assert speed > 0
        with wave.open(output_path, "wb") as audio:
            audio.setnchannels(1)
            audio.setsampwidth(2)
            audio.setframerate(16000)
            audio.writeframes(b"\x00\x00" * 1600)


@pytest.mark.asyncio
async def test_melo_adapter_generates_wave_with_injected_model(tmp_path):
    store = AudioStore(tmp_path, ttl_minutes=30)
    engine = MeloTtsEngine(store, model_factory=FakeMeloModel, ready_override=True)
    job_id = uuid4()

    result = await engine.synthesize(
        TtsSynthesisRequest(
            text="안녕하세요. 멜로 티티에스 테스트입니다.",
            voice_id="sori-warm",
            speed=1.1,
            job_id=job_id,
        )
    )

    assert result.engine_id == "melo"
    assert result.engine_mode == "ai"
    assert result.status == "completed"
    assert store.output_path(job_id).stat().st_size > 44
