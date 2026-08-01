from typing import Literal

from pydantic import BaseModel

EngineStrategyRole = Literal[
    "primary",
    "clone-specialist",
    "fallback",
    "evaluation-only",
]
EngineStrategyStatus = Literal["planned", "integrated", "optional"]
EngineStrategyCostTier = Literal["free", "metered"]
EngineCostPolicy = Literal["free-only", "balanced"]


class EngineCandidate(BaseModel):
    id: str
    name: str
    role: EngineStrategyRole
    status: EngineStrategyStatus
    cost_tier: EngineStrategyCostTier
    enabled_by_default: bool
    languages: list[str]
    capabilities: list[str]
    license_note: str
    selection_reason: str


class EngineStrategyResponse(BaseModel):
    version: str
    cost_policy: EngineCostPolicy
    metered_engines_enabled: bool
    primary_tts_engine: str
    primary_clone_engine: str
    local_fallback_engine: str
    auto_order: list[str]
    candidates: list[EngineCandidate]
