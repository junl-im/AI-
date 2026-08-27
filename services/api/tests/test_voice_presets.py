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
        "sori-warm": 1.02,
        "on-clear": 1.04,
        "dam-calm": 0.99,
        "jun-deep": 1.0,
        "min-energetic": 1.07,
    }
    assert deep.variant_index != clear.variant_index
    assert {
        warm.id: warm.pitch_offset,
        clear.id: clear.pitch_offset,
        calm.id: calm.pitch_offset,
        deep.id: deep.pitch_offset,
        energetic.id: energetic.pitch_offset,
    } == {
        "sori-warm": 0.35,
        "on-clear": -0.65,
        "dam-calm": -0.1,
        "jun-deep": -1.2,
        "min-energetic": 0.45,
    }
    assert (
        deep.pitch_offset
        < clear.pitch_offset
        < calm.pitch_offset
        < warm.pitch_offset
        < energetic.pitch_offset
    )
    with pytest.raises(ValueError, match="지원하지 않는"):
        get_voice_preset("missing")


def test_builtin_voice_presets_clamp_to_realistic_natural_speed_ranges():
    assert get_voice_preset("sori-warm").effective_rate(1.4) == 1.08
    assert get_voice_preset("on-clear").effective_rate(1.0) == 1.04
    assert get_voice_preset("dam-calm").effective_rate(0.7) == 0.94
    assert get_voice_preset("jun-deep").effective_rate(1.4) == 1.06
    assert get_voice_preset("min-energetic").effective_rate(1.0) == 1.07
    assert len({(p.softness, p.articulation) for p in list_voice_presets()}) == 5
