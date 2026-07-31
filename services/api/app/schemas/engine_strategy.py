from typing import Literal

from pydantic import BaseModel

EngineStrategyRole = Literal[
    "primary",
    "clone-specialist",
    "fallback",
    "evaluation-only",
]
EngineStrategyStatus = Literal["planned", "integrated", "optional"]


class EngineCandidate(BaseModel):
    id: str
    name: str
    role: EngineStrategyRole
    status: EngineStrategyStatus
    languages: list[str]
    capabilities: list[str]
    license_note: str
    selection_reason: str


class EngineStrategyResponse(BaseModel):
    version: str
    primary_tts_engine: str
    primary_clone_engine: str
    local_fallback_engine: str
    candidates: list[EngineCandidate]
