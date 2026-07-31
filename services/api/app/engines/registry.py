from app.engines.base import TtsEngine


class EngineRegistry:
    def __init__(self) -> None:
        self._tts_engines: dict[str, TtsEngine] = {}

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

    def clear(self) -> None:
        self._tts_engines.clear()


engine_registry = EngineRegistry()
