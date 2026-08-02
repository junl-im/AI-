from app.services.voice_presets import get_voice_preset


def test_builtin_voice_presets_have_distinct_prosody():
    warm = get_voice_preset("sori-warm")
    clear = get_voice_preset("on-clear")
    calm = get_voice_preset("dam-calm")

    assert len({warm.rate_multiplier, clear.rate_multiplier, calm.rate_multiplier}) == 3
    assert warm.pitch_offset > clear.pitch_offset
    assert get_voice_preset("missing").id == "sori-warm"
