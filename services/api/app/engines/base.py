from abc import ABC, abstractmethod

from app.schemas.engine import EngineInfo
from app.schemas.tts import TtsSynthesisRequest, TtsSynthesisResponse


class TtsEngine(ABC):
    @abstractmethod
    def info(self) -> EngineInfo:
        raise NotImplementedError

    @abstractmethod
    async def synthesize(self, request: TtsSynthesisRequest) -> TtsSynthesisResponse:
        raise NotImplementedError
