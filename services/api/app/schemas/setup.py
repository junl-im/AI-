from typing import Literal

from pydantic import BaseModel

SetupStatus = Literal["ready", "warning", "missing"]


class SetupStep(BaseModel):
    id: str
    label: str
    status: SetupStatus
    required: bool
    detail: str
    action: str | None = None


class SetupStatusResponse(BaseModel):
    version: str
    ready: bool
    real_engine_count: int
    voice_preset_ready_count: int = 0
    voice_preset_expected_count: int = 3
    steps: list[SetupStep]
