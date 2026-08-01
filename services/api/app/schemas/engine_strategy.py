from typing import Literal

from pydantic import BaseModel

EngineStrategyRole = Literal["primary", "fallback", "test-only"]
EngineStrategyStatus = Literal["integrated", "optional", "test-only"]
EngineRuntime = Literal["local-worker", "local-process", "device", "test"]


class EngineCandidate(BaseModel):
    id: str
    name: str
    role: EngineStrategyRole
    status: EngineStrategyStatus
    runtime: EngineRuntime
    enabled_by_default: bool
    languages: list[str]
    capabilities: list[str]
    license_note: str
    selection_reason: str


class EngineStrategyResponse(BaseModel):
    version: str
    free_only: Literal[True]
    deployment_profile: Literal["firebase-static-plus-local-runtime"]
    primary_tts_engine: str
    primary_clone_engine: str
    local_fallback_engine: str
    browser_fallback_engine: str
    auto_order: list[str]
    candidates: list[EngineCandidate]
