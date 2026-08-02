from dataclasses import dataclass


@dataclass(frozen=True)
class VoicePresetProfile:
    id: str
    display_name: str
    rate_multiplier: float
    pitch_offset: float


_PRESETS = {
    "sori-warm": VoicePresetProfile("sori-warm", "혜린", 0.96, 1.5),
    "on-clear": VoicePresetProfile("on-clear", "도윤", 1.04, -1.5),
    "dam-calm": VoicePresetProfile("dam-calm", "소리", 0.90, -0.5),
}


def get_voice_preset(voice_id: str) -> VoicePresetProfile:
    return _PRESETS.get(voice_id, _PRESETS["sori-warm"])
