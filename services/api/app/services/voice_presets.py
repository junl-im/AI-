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
    natural_speed_min: float
    natural_speed_max: float
    softness: float
    articulation: float

    def effective_rate(self, requested_speed: float) -> float:
        raw = requested_speed * self.rate_multiplier
        return max(self.natural_speed_min, min(self.natural_speed_max, raw))

    @property
    def requires_gender_match(self) -> bool:
        return self.gender in {"female", "male"}


_PRESETS = {
    "sori-warm": VoicePresetProfile(
        "sori-warm",
        "혜린",
        "female",
        1.02,
        0.35,
        0,
        ("sunhi", "yuna", "heami", "seoyeon"),
        0.96, 1.08, 0.92, 0.72,
    ),
    "on-clear": VoicePresetProfile(
        "on-clear",
        "도윤",
        "male",
        1.04,
        -0.65,
        0,
        ("injoon", "hyunsu"),
        0.98, 1.10, 0.76, 0.94,
    ),
    "dam-calm": VoicePresetProfile(
        "dam-calm",
        "소리",
        "neutral",
        0.99,
        -0.1,
        0,
        ("jimin", "natural", "neutral", "중성"),
        0.94, 1.05, 0.96, 0.68,
    ),
    "jun-deep": VoicePresetProfile(
        "jun-deep",
        "준호",
        "male",
        1.00,
        -1.2,
        1,
        ("minsu", "bongjin", "yong", "deep", "baritone"),
        0.95, 1.06, 0.84, 0.86,
    ),
    "min-energetic": VoicePresetProfile(
        "min-energetic",
        "민준",
        "male",
        1.07,
        0.45,
        2,
        ("young male", "energetic", "youngho"),
        1.00, 1.13, 0.78, 0.90,
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
