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
    steps: list[SetupStep]
