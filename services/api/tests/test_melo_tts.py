import wave
from types import SimpleNamespace
from uuid import uuid4

import pytest

from app.engines.tts.melo_tts import MeloTtsEngine
from app.schemas.tts import TtsSynthesisRequest
from app.services.voice_presets import VoicePresetUnavailableError
from app.storage.audio_store import AudioStore


class FakeMeloModel:
    hps = SimpleNamespace(data=SimpleNamespace(spk2id={"KR": 0}))

    def __init__(self):
        self.speed = 0.0
        self.speaker_id = None

    def tts_to_file(self, text, speaker_id, output_path, speed):
        assert text
        assert speed > 0
        self.speed = speed
        self.speaker_id = speaker_id
        with wave.open(output_path, "wb") as audio:
            audio.setnchannels(1)
            audio.setsampwidth(2)
            audio.setframerate(16000)
            audio.writeframes(b"\x00\x00" * 1600)


class MultiSpeakerMeloModel(FakeMeloModel):
    hps = SimpleNamespace(
        data=SimpleNamespace(
            spk2id={
                "Heami Female": 1,
                "InJoon Male": 2,
                "Minsu Male": 3,
            }
        )
    )


@pytest.mark.asyncio
async def test_melo_single_speaker_allows_neutral_preset_only(tmp_path):
    store = AudioStore(tmp_path, ttl_minutes=30)
    model = FakeMeloModel()
    engine = MeloTtsEngine(store, model_factory=lambda: model, ready_override=True)
    job_id = uuid4()

    result = await engine.synthesize(
        TtsSynthesisRequest(
            text="안녕하세요. 멜로 티티에스 테스트입니다.",
            voice_id="dam-calm",
            speed=1.1,
            job_id=job_id,
        )
    )

    assert result.engine_id == "melo"
    assert result.engine_mode == "ai"
    assert result.status == "completed"
    assert store.output_path(job_id).stat().st_size > 44
    assert model.speaker_id == 0
    assert model.speed == pytest.approx(1.1 * 0.90)


@pytest.mark.asyncio
async def test_melo_selects_gender_compatible_named_speaker(tmp_path):
    store = AudioStore(tmp_path, ttl_minutes=30)
    model = MultiSpeakerMeloModel()
    engine = MeloTtsEngine(store, model_factory=lambda: model, ready_override=True)

    await engine.synthesize(
        TtsSynthesisRequest(
            text="도윤 남성 화자를 확인합니다.",
            voice_id="on-clear",
            job_id=uuid4(),
        )
    )

    assert model.speaker_id == 2


@pytest.mark.asyncio
async def test_melo_uses_distinct_male_speaker_slot_when_names_are_generic(tmp_path):
    class GenericMultiSpeakerMeloModel(FakeMeloModel):
        hps = SimpleNamespace(
            data=SimpleNamespace(
                spk2id={
                    "Generic Male 1": 10,
                    "Generic Male 2": 11,
                    "Generic Male 3": 12,
                }
            )
        )

    model = GenericMultiSpeakerMeloModel()
    engine = MeloTtsEngine(
        AudioStore(tmp_path, ttl_minutes=30),
        model_factory=lambda: model,
        ready_override=True,
    )

    await engine.synthesize(
        TtsSynthesisRequest(
            text="준호 화자는 두 번째 남성 후보를 사용합니다.",
            voice_id="jun-deep",
            job_id=uuid4(),
        )
    )

    assert model.speaker_id == 11


@pytest.mark.asyncio
async def test_melo_does_not_replace_male_preset_with_unknown_single_speaker(tmp_path):
    engine = MeloTtsEngine(
        AudioStore(tmp_path, ttl_minutes=30),
        model_factory=FakeMeloModel,
        ready_override=True,
    )

    with pytest.raises(VoicePresetUnavailableError, match="반대 성별"):
        await engine.synthesize(
            TtsSynthesisRequest(
                text="남성 프리셋 성별 보호 테스트입니다.",
                voice_id="on-clear",
                job_id=uuid4(),
            )
        )
