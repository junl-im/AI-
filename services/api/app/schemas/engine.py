from pydantic import BaseModel


class EngineInfo(BaseModel):
    id: str
    name: str
    kind: str
    languages: list[str]
    supports_emotion: bool
    supports_voice_clone: bool
    ready: bool
