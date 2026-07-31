from typing import Literal

from pydantic import BaseModel

EngineMode = Literal["mock", "local", "ai"]


class EngineInfo(BaseModel):
    id: str
    name: str
    kind: str
    mode: EngineMode
    provider: str
    languages: list[str]
    output_formats: list[str]
    supports_emotion: bool
    supports_speed: bool = True
    supports_pitch: bool = False
    supports_voice_clone: bool
    ready: bool
    reason: str | None = None
