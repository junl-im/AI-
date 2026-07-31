from app.engines.base import TtsEngine
from app.engines.voiceclone.cosyvoice_worker import CosyVoiceCloneEngine


class EngineRegistry:
    def __init__(self) -> None:
        self._tts_engines: dict[str, TtsEngine] = {}
        self._voice_clone_engines: dict[str, CosyVoiceCloneEngine] = {}

    def register_tts(self, engine: TtsEngine) -> None:
        engine_id = engine.info().id
        if engine_id in self._tts_engines:
            raise ValueError(f"이미 등록된 TTS 엔진입니다: {engine_id}")
        self._tts_engines[engine_id] = engine

    def get_tts(self, engine_id: str) -> TtsEngine | None:
        return self._tts_engines.get(engine_id)

    def resolve_tts(self, preferred: str) -> TtsEngine | None:
        if preferred != "auto":
            return self.get_tts(preferred)
        for engine in self._tts_engines.values():
            info = engine.info()
            if info.ready and info.mode != "mock":
                return engine
        return next(
            (engine for engine in self._tts_engines.values() if engine.info().ready),
            None,
        )

    def list_tts(self) -> list[TtsEngine]:
        return list(self._tts_engines.values())


    def register_voice_clone(self, engine: CosyVoiceCloneEngine) -> None:
        engine_id = engine.info().id
        if engine_id in self._voice_clone_engines:
            raise ValueError(f"이미 등록된 음성 복제 엔진입니다: {engine_id}")
        self._voice_clone_engines[engine_id] = engine

    def resolve_voice_clone(self, preferred: str) -> CosyVoiceCloneEngine | None:
        if preferred != "auto":
            return self._voice_clone_engines.get(preferred)
        for engine in self._voice_clone_engines.values():
            if engine.info().ready:
                return engine
        return next(iter(self._voice_clone_engines.values()), None)

    def list_voice_clone(self) -> list[CosyVoiceCloneEngine]:
        return list(self._voice_clone_engines.values())

    def clear(self) -> None:
        self._tts_engines.clear()
        self._voice_clone_engines.clear()


engine_registry = EngineRegistry()
