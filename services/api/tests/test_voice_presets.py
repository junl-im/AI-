import pytest

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
    assert {
        warm.id: warm.rate_multiplier,
        clear.id: clear.rate_multiplier,
        calm.id: calm.rate_multiplier,
        deep.id: deep.rate_multiplier,
        energetic.id: energetic.rate_multiplier,
    } == {
        "sori-warm": 1.00,
        "on-clear": 1.04,
        "dam-calm": 0.98,
        "jun-deep": 0.98,
        "min-energetic": 1.08,
    }
    assert deep.variant_index != clear.variant_index
    assert deep.pitch_offset < clear.pitch_offset < energetic.pitch_offset < warm.pitch_offset
    with pytest.raises(ValueError, match="지원하지 않는"):
        get_voice_preset("missing")
