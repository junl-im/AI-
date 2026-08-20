from dataclasses import dataclass
from typing import Literal

VoiceGender = Literal["female", "male", "neutral"]


class VoicePresetUnavailableError(ValueError):
    """Requested preset cannot be rendered faithfully by the selected engine."""



@dataclass(frozen=True)
class VoicePresetProfile:
    id: str
    display_name: str
    gender: VoiceGender
    rate_multiplier: float
    pitch_offset: float
    variant_index: int
    preferred_voice_tokens: tuple[str, ...]

    @property
    def requires_gender_match(self) -> bool:
        return self.gender in {"female", "male"}


_PRESETS = {
    "sori-warm": VoicePresetProfile(
        "sori-warm",
        "혜린",
        "female",
        1.00,
        0.5,
        0,
        ("sunhi", "yuna", "heami", "seoyeon"),
    ),
    "on-clear": VoicePresetProfile(
        "on-clear",
        "도윤",
        "male",
        1.04,
        -0.5,
        0,
        ("injoon", "hyunsu"),
    ),
    "dam-calm": VoicePresetProfile(
        "dam-calm",
        "소리",
        "neutral",
        0.98,
        0.0,
        0,
        ("jimin", "natural", "neutral", "중성"),
    ),
    "jun-deep": VoicePresetProfile(
        "jun-deep",
        "준호",
        "male",
        0.98,
        -1.0,
        1,
        ("minsu", "bongjin", "yong", "deep", "baritone"),
    ),
    "min-energetic": VoicePresetProfile(
        "min-energetic",
        "민준",
        "male",
        1.08,
        0.25,
        2,
        ("young male", "energetic", "youngho"),
    ),
}

PRESET_VOICE_IDS = tuple(_PRESETS)


def get_voice_preset(voice_id: str) -> VoicePresetProfile:
    try:
        return _PRESETS[voice_id]
    except KeyError as error:
        raise VoicePresetUnavailableError(f"지원하지 않는 음성 프리셋입니다: {voice_id}") from error


def find_voice_preset(voice_id: str) -> VoicePresetProfile | None:
    return _PRESETS.get(voice_id)


def list_voice_presets() -> tuple[VoicePresetProfile, ...]:
    return tuple(_PRESETS.values())
