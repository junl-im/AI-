from app.services.voice_presets import PRESET_VOICE_IDS, get_voice_preset, list_voice_presets


def test_builtin_voice_presets_have_distinct_prosody_and_three_male_options():
    warm = get_voice_preset("sori-warm")
    clear = get_voice_preset("on-clear")
    calm = get_voice_preset("dam-calm")
    deep = get_voice_preset("jun-deep")
    energetic = get_voice_preset("min-energetic")

    assert len(PRESET_VOICE_IDS) == 5
    assert {profile.id for profile in list_voice_presets()} == set(PRESET_VOICE_IDS)
    assert sum(profile.gender == "male" for profile in list_voice_presets()) == 3
    rates = {
        warm.rate_multiplier,
        clear.rate_multiplier,
        calm.rate_multiplier,
        deep.rate_multiplier,
        energetic.rate_multiplier,
    }
    assert len(rates) == 5
    assert deep.pitch_offset < clear.pitch_offset < energetic.pitch_offset < warm.pitch_offset
    assert get_voice_preset("missing").id == "sori-warm"
