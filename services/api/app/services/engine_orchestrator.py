import asyncio
import time
from collections.abc import Awaitable, Callable
from dataclasses import dataclass

from app.engines.base import TtsEngine
from app.engines.registry import EngineRegistry
from app.schemas.engine import EngineInfo
from app.schemas.tts import TtsSynthesisRequest, TtsSynthesisResponse

EngineRunner = Callable[[TtsEngine, TtsSynthesisRequest], Awaitable[TtsSynthesisResponse]]


class EngineUnavailableError(RuntimeError):
    pass


class EngineRequestUnsupportedError(ValueError):
    pass


class EngineExhaustedError(RuntimeError):
    def __init__(self, attempts: list[str], errors: list[str]) -> None:
        self.attempts = attempts
        self.errors = errors
        detail = "; ".join(errors) if errors else "실행 가능한 엔진이 없습니다."
        super().__init__(detail)


@dataclass
class EngineRuntimeState:
    successes: int = 0
    failures: int = 0
    consecutive_failures: int = 0
    open_until: float = 0.0
    last_error: str | None = None


class EngineOrchestrator:
    def __init__(
        self,
        registry: EngineRegistry,
        preferred_order: list[str] | None = None,
        failure_threshold: int = 2,
        cooldown_seconds: float = 30.0,
        clock: Callable[[], float] = time.monotonic,
    ) -> None:
        self.registry = registry
        self.preferred_order = preferred_order or []
        self.failure_threshold = max(1, failure_threshold)
        self.cooldown_seconds = max(1.0, cooldown_seconds)
        self._clock = clock
        self._runtime: dict[str, EngineRuntimeState] = {}
        self._lock = asyncio.Lock()

    def list_info(self) -> list[EngineInfo]:
        candidates = self._ranked_engines(None)
        recommended_id = next(
            (
                engine.info().id
                for engine in candidates
                if engine.info().ready and not self._circuit_open(engine.info().id)
            ),
            None,
        )
        now = self._clock()
        result: list[EngineInfo] = []
        for engine in self.registry.list_tts():
            info = engine.info()
            state = self._runtime.get(info.id, EngineRuntimeState())
            remaining = max(0.0, state.open_until - now)
            health = (
                "unavailable"
                if not info.ready
                else "cooldown"
                if remaining > 0
                else "ready"
            )
            result.append(
                info.model_copy(
                    update={
                        "recommended": info.id == recommended_id,
                        "health": health,
                        "success_count": state.successes,
                        "failure_count": state.failures,
                        "consecutive_failures": state.consecutive_failures,
                        "cooldown_remaining_seconds": round(remaining, 1),
                        "last_error": state.last_error,
                    }
                )
            )
        return sorted(result, key=lambda item: self._sort_key(item, None))

    async def synthesize(
        self,
        request: TtsSynthesisRequest,
        runner: EngineRunner,
    ) -> TtsSynthesisResponse:
        preferred = request.engine_id or "auto"
        candidates = self._candidate_engines(request, preferred)
        if not candidates:
            selected = self.registry.get_tts(preferred) if preferred != "auto" else None
            if preferred != "auto" and selected is None:
                raise EngineUnavailableError(f"'{preferred}' 음성 엔진을 찾지 못했습니다.")
            ready = [engine.info() for engine in self.registry.list_tts() if engine.info().ready]
            compatible = [info for info in ready if self._compatible(info, request)]
            if preferred == "auto" and compatible:
                raise EngineUnavailableError(
                    "준비된 음성 엔진이 일시적인 장애 격리 상태입니다."
                )
            if selected is not None and selected.info().ready:
                raise EngineRequestUnsupportedError(
                    f"'{preferred}' 엔진은 {request.output_format.upper()} 출력을 "
                    "지원하지 않습니다."
                )
            if preferred == "auto" and ready:
                raise EngineRequestUnsupportedError(
                    f"준비된 엔진이 {request.output_format.upper()} 출력을 지원하지 않습니다."
                )
            raise EngineUnavailableError("현재 실행 가능한 음성 엔진이 없습니다.")

        attempts: list[str] = []
        errors: list[str] = []
        for engine in candidates:
            info = engine.info()
            attempts.append(info.id)
            try:
                engine_request = request.model_copy(update={"engine_id": info.id})
                result = await runner(engine, engine_request)
            except asyncio.CancelledError:
                raise
            except Exception as error:
                message = str(error).strip() or error.__class__.__name__
                errors.append(f"{info.id}: {message}")
                await self._record_failure(info.id, message)
                continue
            await self._record_success(info.id)
            return result.model_copy(
                update={
                    "requested_engine_id": preferred,
                    "attempted_engine_ids": attempts,
                    "fallback_used": len(attempts) > 1 or (
                        preferred not in {"auto", info.id}
                    ),
                }
            )
        raise EngineExhaustedError(attempts, errors)

    def _candidate_engines(
        self,
        request: TtsSynthesisRequest,
        preferred: str,
    ) -> list[TtsEngine]:
        if preferred != "auto":
            engine = self.registry.get_tts(preferred)
            if engine is None or not self._compatible(engine.info(), request):
                return []
            return [engine]

        ranked = self._ranked_engines(request)
        available = [
            engine
            for engine in ranked
            if self._compatible(engine.info(), request)
            and not self._circuit_open(engine.info().id)
        ]
        return available

    def _ranked_engines(self, request: TtsSynthesisRequest | None) -> list[TtsEngine]:
        return sorted(
            self.registry.list_tts(),
            key=lambda engine: self._sort_key(engine.info(), request),
        )

    def _sort_key(
        self,
        info: EngineInfo,
        request: TtsSynthesisRequest | None,
    ) -> tuple[int, int, int, int, int, str]:
        try:
            configured_rank = self.preferred_order.index(info.id)
        except ValueError:
            configured_rank = len(self.preferred_order) + 10
        mode_rank = {"ai": 0, "local": 1, "mock": 2}.get(info.mode, 3)
        capability_penalty = 0
        if request is not None:
            if request.emotion != "neutral" and not info.supports_emotion:
                capability_penalty += 20
            if request.pitch != 0 and not info.supports_pitch:
                capability_penalty += 20
            if request.speed != 1 and not info.supports_speed:
                capability_penalty += 20
        quality_rank = {
            "reference": 0,
            "premium": 1,
            "standard": 2,
            "basic": 3,
        }.get(info.quality_tier, 4)
        return (
            0 if info.ready else 1,
            configured_rank + capability_penalty,
            quality_rank,
            100 - info.korean_specialization,
            mode_rank,
            info.id,
        )

    @staticmethod
    def _compatible(info: EngineInfo, request: TtsSynthesisRequest) -> bool:
        return (
            info.ready
            and request.output_format in info.output_formats
            and "ko-KR" in info.languages
        )

    def _circuit_open(self, engine_id: str) -> bool:
        state = self._runtime.get(engine_id)
        return bool(state and state.open_until > self._clock())

    async def _record_success(self, engine_id: str) -> None:
        async with self._lock:
            state = self._runtime.setdefault(engine_id, EngineRuntimeState())
            state.successes += 1
            state.consecutive_failures = 0
            state.open_until = 0.0
            state.last_error = None

    async def _record_failure(self, engine_id: str, message: str) -> None:
        async with self._lock:
            state = self._runtime.setdefault(engine_id, EngineRuntimeState())
            state.failures += 1
            state.consecutive_failures += 1
            state.last_error = message[:300]
            if state.consecutive_failures >= self.failure_threshold:
                state.open_until = self._clock() + self.cooldown_seconds
