import struct
import wave

import pytest

from app.services.prosody_director import plan_prosody
from app.services.voice_presets import list_voice_presets
from app.services.wav_tools import ensure_trailing_silence, wav_duration_seconds


def test_persona_plans_are_distinct_bounded_and_do_not_accelerate_dense_material():
    plans = []
    for preset in list_voice_presets():
        normal = plan_prosody(preset.id, "한국어 문장을 읽습니다.", 1.0)
        dense = plan_prosody(preset.id, "API(에이피아이) 3.5% " * 80, 1.0)
        plans.append((normal.max_chars, normal.pause_ms))
        assert preset.natural_speed_min <= preset.effective_rate(dense.requested_speed)
        assert preset.effective_rate(dense.requested_speed) <= preset.rate_multiplier
        assert normal.pause_ms <= dense.pause_ms <= 340
        assert plan_prosody(preset.id, "긴 문장", 1.4, 60).max_chars == 60
    assert len(set(plans)) == 5
    assert plan_prosody("my-voice:private", "원본", 1.0).requested_speed == 1.0


@pytest.mark.parametrize("channels", [1, 2])
def test_boundary_topup_preserves_speech_and_is_idempotent(tmp_path, channels):
    path = tmp_path / "segment.wav"
    speech = struct.pack("<h", 3000) * 100 * channels
    with wave.open(str(path), "wb") as audio:
        audio.setnchannels(channels)
        audio.setsampwidth(2)
        audio.setframerate(1000)
        audio.writeframes(speech + b"\x00\x00" * 50 * channels)
    ensure_trailing_silence(path, 240)
    assert wav_duration_seconds(path) == pytest.approx(0.34)
    with wave.open(str(path), "rb") as audio:
        assert audio.readframes(100) == speech
    first = path.read_bytes()
    ensure_trailing_silence(path, 240)
    assert path.read_bytes() == first
