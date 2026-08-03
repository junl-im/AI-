from dataclasses import dataclass
from typing import Literal

VoiceGender = Literal["female", "male", "neutral"]


@dataclass(frozen=True)
class VoicePresetProfile:
    id: str
    display_name: str
    gender: VoiceGender
    rate_multiplier: float
    pitch_offset: float


_PRESETS = {
    "sori-warm": VoicePresetProfile("sori-warm", "혜린", "female", 0.96, 1.5),
    "on-clear": VoicePresetProfile("on-clear", "도윤", "male", 1.04, -1.5),
    "dam-calm": VoicePresetProfile("dam-calm", "소리", "neutral", 0.90, -0.5),
    "jun-deep": VoicePresetProfile("jun-deep", "준호", "male", 0.92, -2.5),
    "min-energetic": VoicePresetProfile(
        "min-energetic", "민준", "male", 1.08, -0.5
    ),
}

PRESET_VOICE_IDS = tuple(_PRESETS)


def get_voice_preset(voice_id: str) -> VoicePresetProfile:
    return _PRESETS.get(voice_id, _PRESETS["sori-warm"])


def list_voice_presets() -> tuple[VoicePresetProfile, ...]:
    return tuple(_PRESETS.values())
