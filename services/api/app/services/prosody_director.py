"""Conservative persona rhythm for internal long-form WAV boundaries, not voice cloning."""
import re
from dataclasses import dataclass

from app.services.voice_presets import find_voice_preset


@dataclass(frozen=True)
class ProsodyPlan:
    max_chars: int
    pause_ms: int
    requested_speed: float


PROSODY_POLICY_REVISION = "prosody/1"

# Breath budgets and minimum boundary silence. Real timbre comes from approved references.
_POLICIES = {
    "sori-warm": (150, 160),
    "on-clear": (140, 190),
    "dam-calm": (170, 240),
    "jun-deep": (160, 280),
    "min-energetic": (125, 110),
    "byeol-oracle": (155, 285),
}


def plan_prosody(voice_id: str, text: str, speed: float, max_chars: int = 180) -> ProsodyPlan:
    preset = find_voice_preset(voice_id)
    if preset is None:
        return ProsodyPlan(max_chars, 120, speed)
    budget, pause = _POLICIES[voice_id]
    dense = bool(re.search(r"\d|[A-Za-z]|[()（）]", text))
    longform = len(text) > 500
    # Slow only dense or extended material, never accelerate to manufacture character.
    correction = 0.97 if dense else 1.0
    if longform and voice_id == "min-energetic":
        correction *= 0.97
    effective = preset.effective_rate(speed * correction)
    if dense:
        pause += round(40 * preset.articulation)
    if longform:
        pause += round(35 * preset.softness)
    return ProsodyPlan(min(max_chars, budget), min(340, pause), effective / preset.rate_multiplier)
