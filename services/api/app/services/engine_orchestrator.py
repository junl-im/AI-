import asyncio
import inspect
import time
from collections.abc import Awaitable, Callable
from dataclasses import dataclass
from datetime import datetime, timezone

from app.engines.base import TtsEngine
from app.engines.registry import EngineRegistry
from app.schemas.engine import EngineInfo
from app.schemas.tts import TtsSynthesisRequest, TtsSynthesisResponse
from app.services.voice_presets import VoicePresetUnavailableError

EngineRunner = Callable[[TtsEngine, TtsSynthesisRequest], Awaitable[TtsSynthesisResponse]]


class EngineUnavailableError(RuntimeError):
    pass


class EngineRequestUnsupportedError(ValueError):
    pass


class EngineRuntimeBusyError(RuntimeError):
    pass


class EngineRefreshError(RuntimeError):
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
    circuit_open_count: int = 0
    backoff_level: int = 0
    probe_in_flight: bool = False
    active_requests: int = 0
    maintenance_in_flight: bool = False
    total_latency_ms: float = 0.0
    last_latency_ms: float | None = None
    last_success_at: str | None = None
    last_failure_at: str | None = None


@dataclass(frozen=True)
class AttemptSlot:
    allowed: bool
    probe: bool = False
    reason: str | None = None


class EngineOrchestrator:
    def __init__(
        self,
        registry: EngineRegistry,
        preferred_order: list[str] | None = None,
        failure_threshold: int = 2,
        cooldown_seconds: float = 30.0,
        max_cooldown_seconds: float = 240.0,
        clock: Callable[[], float] = time.monotonic,
    ) -> None:
        self.registry = registry
        self.preferred_order = preferred_order or []
        self.failure_threshold = max(1, failure_threshold)
        self.cooldown_seconds = max(1.0, cooldown_seconds)
        self.max_cooldown_seconds = max(
            self.cooldown_seconds,
            max_cooldown_seconds,
        )
        self._clock = clock
        self._runtime: dict[str, EngineRuntimeState] = {}
        self._lock = asyncio.Lock()

    def list_info(self) -> list[EngineInfo]:
        candidates = self._ranked_engines(None)
        recommended_id = next(
            (
                engine.info().id
                for engine in candidates
                if self._available_for_recommendation(engine.info())
            ),
            None,
        )
        now = self._clock()
        result: list[EngineInfo] = []
        for engine in self.registry.list_tts():
            info = engine.info()
            state = self._runtime.get(info.id, EngineRuntimeState())
            remaining = max(0.0, state.open_until - now)
            health = self._health(info, state, remaining)
            attempts = state.successes + state.failures
            success_rate = (state.successes / attempts) if attempts else None
            average_latency = (
                state.total_latency_ms / attempts
                if attempts
                else None
            )
            result.append(
                info.model_copy(
                    update={
                        "auto_eligible": True,
                        "recommended": info.id == recommended_id,
                        "health": health,
                        "success_count": state.successes,
                        "failure_count": state.failures,
                        "attempt_count": attempts,
                        "success_rate": (
                            round(success_rate, 4)
                            if success_rate is not None
                            else None
                        ),
                        "consecutive_failures": state.consecutive_failures,
                        "cooldown_remaining_seconds": round(remaining, 1),
                        "last_error": state.last_error,
                        "circuit_open_count": state.circuit_open_count,
                        "probe_in_flight": state.probe_in_flight,
                        "average_latency_ms": (
                            round(average_latency, 1)
                            if average_latency is not None
                            else None
                        ),
                        "last_latency_ms": (
                            round(state.last_latency_ms, 1)
                            if state.last_latency_ms is not None
                            else None
                        ),
                        "last_success_at": state.last_success_at,
                        "last_failure_at": state.last_failure_at,
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
            self._raise_no_candidate(request, preferred)

        attempts: list[str] = []
        errors: list[str] = []
        preset_errors: list[str] = []
        skipped_runtime: list[str] = []
        for engine in candidates:
            info = engine.info()
            slot = await self._claim_attempt(info.id)
            if not slot.allowed:
                skipped_runtime.append(f"{info.id}:{slot.reason or 'unavailable'}")
                continue

            attempts.append(info.id)
            started = self._clock()
            try:
                engine_request = request.model_copy(update={"engine_id": info.id})
                result = await runner(engine, engine_request)
            except asyncio.CancelledError:
                await self._release_attempt(info.id, probe=slot.probe)
                raise
            except VoicePresetUnavailableError as error:
                await self._release_attempt(info.id, probe=slot.probe)
                message = str(error).strip() or error.__class__.__name__
                detail = f"{info.id}: {message}"
                errors.append(detail)
                preset_errors.append(detail)
                continue
            except Exception as error:
                elapsed_ms = self._elapsed_ms(started)
                message = str(error).strip() or error.__class__.__name__
                errors.append(f"{info.id}: {message}")
                await self._record_failure(info.id, message, elapsed_ms)
                continue

            elapsed_ms = self._elapsed_ms(started)
            await self._record_success(info.id, elapsed_ms)
            return result.model_copy(
                update={
                    "requested_engine_id": preferred,
                    "attempted_engine_ids": attempts,
                    "fallback_used": len(attempts) > 1 or (
                        preferred not in {"auto", info.id}
                    ),
                }
            )

        if attempts and len(preset_errors) == len(attempts):
            raise EngineRequestUnsupportedError("; ".join(preset_errors))
        if not attempts and skipped_runtime:
            if preferred != "auto":
                raise EngineUnavailableError(
                    f"'{preferred}' 엔진은 장애 격리 또는 복구 확인 중입니다."
                )
            raise EngineUnavailableError(
                "준비된 음성 엔진이 장애 격리 또는 복구 확인 중입니다."
            )
        raise EngineExhaustedError(attempts, errors)

    async def reset_runtime(self, engine_id: str) -> EngineInfo:
        engine = self.registry.get_tts(engine_id)
        if engine is None:
            raise EngineUnavailableError(f"'{engine_id}' 음성 엔진을 찾지 못했습니다.")
        async with self._lock:
            current = self._runtime.setdefault(engine_id, EngineRuntimeState())
            if (
                current.probe_in_flight
                or current.active_requests > 0
                or current.maintenance_in_flight
            ):
                raise EngineRuntimeBusyError(
                    f"'{engine_id}' 엔진에 실행 중인 합성 또는 복구 요청이 있습니다."
                )
            current.maintenance_in_flight = True

        refresh = getattr(engine, "refresh_runtime", None)
        try:
            if callable(refresh):
                refreshed = refresh()
                if inspect.isawaitable(refreshed):
                    await refreshed
        except asyncio.CancelledError:
            await self._release_maintenance(engine_id)
            raise
        except Exception as error:
            await self._release_maintenance(engine_id)
            message = str(error).strip() or error.__class__.__name__
            raise EngineRefreshError(
                f"'{engine_id}' 엔진 재탐지에 실패했습니다: {message}"
            ) from error

        async with self._lock:
            self._runtime[engine_id] = EngineRuntimeState()
        return next(item for item in self.list_info() if item.id == engine_id)

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

        return [
            engine
            for engine in self._ranked_engines(request)
            if self._compatible(engine.info(), request)
        ]

    def _raise_no_candidate(
        self,
        request: TtsSynthesisRequest,
        preferred: str,
    ) -> None:
        selected = self.registry.get_tts(preferred) if preferred != "auto" else None
        if preferred != "auto" and selected is None:
            raise EngineUnavailableError(f"'{preferred}' 음성 엔진을 찾지 못했습니다.")
        ready = [
            engine.info()
            for engine in self.registry.list_tts()
            if engine.info().ready
        ]
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

    def _available_for_recommendation(self, info: EngineInfo) -> bool:
        if not info.ready:
            return False
        state = self._runtime.get(info.id)
        if state is None:
            return True
        return (
            not state.probe_in_flight
            and not state.maintenance_in_flight
            and state.open_until <= self._clock()
        )

    @staticmethod
    def _health(
        info: EngineInfo,
        state: EngineRuntimeState,
        remaining: float,
    ) -> str:
        if not info.ready:
            return "unavailable"
        if state.probe_in_flight or state.maintenance_in_flight:
            return "probing"
        if remaining > 0:
            return "cooldown"
        return "ready"

    async def _claim_attempt(self, engine_id: str) -> AttemptSlot:
        async with self._lock:
            state = self._runtime.setdefault(engine_id, EngineRuntimeState())
            now = self._clock()
            if state.maintenance_in_flight:
                return AttemptSlot(False, reason="maintenance")
            if state.open_until > now:
                return AttemptSlot(False, reason="cooldown")
            if state.open_until > 0:
                if state.probe_in_flight:
                    return AttemptSlot(False, reason="probing")
                state.probe_in_flight = True
                state.active_requests += 1
                return AttemptSlot(True, probe=True)
            state.active_requests += 1
            return AttemptSlot(True)

    async def _release_attempt(self, engine_id: str, *, probe: bool) -> None:
        async with self._lock:
            state = self._runtime.get(engine_id)
            if state is None:
                return
            state.active_requests = max(0, state.active_requests - 1)
            if probe:
                state.probe_in_flight = False

    async def _release_maintenance(self, engine_id: str) -> None:
        async with self._lock:
            state = self._runtime.get(engine_id)
            if state is not None:
                state.maintenance_in_flight = False

    async def _record_success(self, engine_id: str, elapsed_ms: float) -> None:
        async with self._lock:
            state = self._runtime.setdefault(engine_id, EngineRuntimeState())
            state.successes += 1
            state.active_requests = max(0, state.active_requests - 1)
            state.consecutive_failures = 0
            state.open_until = 0.0
            state.probe_in_flight = False
            state.backoff_level = 0
            state.last_error = None
            state.last_latency_ms = elapsed_ms
            state.total_latency_ms += elapsed_ms
            state.last_success_at = self._timestamp()

    async def _record_failure(
        self,
        engine_id: str,
        message: str,
        elapsed_ms: float,
    ) -> None:
        async with self._lock:
            state = self._runtime.setdefault(engine_id, EngineRuntimeState())
            state.failures += 1
            state.active_requests = max(0, state.active_requests - 1)
            state.consecutive_failures += 1
            state.probe_in_flight = False
            state.last_error = message[:300]
            state.last_latency_ms = elapsed_ms
            state.total_latency_ms += elapsed_ms
            state.last_failure_at = self._timestamp()
            if state.consecutive_failures >= self.failure_threshold:
                state.circuit_open_count += 1
                state.backoff_level += 1
                multiplier = 2 ** max(0, state.backoff_level - 1)
                cooldown = min(
                    self.cooldown_seconds * multiplier,
                    self.max_cooldown_seconds,
                )
                state.open_until = self._clock() + cooldown

    def _elapsed_ms(self, started: float) -> float:
        return max(0.0, (self._clock() - started) * 1000)

    @staticmethod
    def _timestamp() -> str:
        return datetime.now(timezone.utc).isoformat()
