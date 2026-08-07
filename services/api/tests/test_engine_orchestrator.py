from uuid import uuid4

import pytest

from app.engines.base import TtsEngine
from app.engines.registry import EngineRegistry
from app.schemas.engine import EngineInfo
from app.schemas.tts import TtsSynthesisRequest, TtsSynthesisResponse
from app.services.engine_orchestrator import (
    EngineExhaustedError,
    EngineOrchestrator,
    EngineRequestUnsupportedError,
    EngineRuntimeBusyError,
    EngineUnavailableError,
)
from app.services.voice_presets import VoicePresetUnavailableError


class FakeEngine(TtsEngine):
    def __init__(
        self,
        engine_id: str,
        mode: str = "ai",
        ready: bool = True,
        supports_emotion: bool = False,
    ) -> None:
        self.engine_id = engine_id
        self.mode = mode
        self.ready = ready
        self.supports_emotion = supports_emotion

    def info(self) -> EngineInfo:
        return EngineInfo(
            id=self.engine_id,
            name=self.engine_id,
            kind="tts",
            mode=self.mode,
            provider="test",
            languages=["ko-KR"],
            output_formats=["wav"],
            supports_emotion=self.supports_emotion,
            supports_speed=True,
            supports_voice_clone=False,
            ready=self.ready,
        )

    async def synthesize(self, request: TtsSynthesisRequest) -> TtsSynthesisResponse:
        return TtsSynthesisResponse(
            job_id=str(request.job_id or uuid4()),
            status="completed",
            engine_id=self.engine_id,
            engine_mode=self.mode,
            audio_url=None,
            estimated_duration_seconds=1,
            message="ok",
        )


def request(engine_id: str = "auto") -> TtsSynthesisRequest:
    return TtsSynthesisRequest(
        text="자동 엔진 전환을 확인합니다.",
        voice_id="sori-warm",
        engine_id=engine_id,
        job_id=uuid4(),
    )


@pytest.mark.asyncio
async def test_auto_mode_falls_back_to_next_ready_engine():
    registry = EngineRegistry()
    registry.register_tts(FakeEngine("primary"))
    registry.register_tts(FakeEngine("backup"))
    orchestrator = EngineOrchestrator(
        registry,
        preferred_order=["primary", "backup"],
    )

    async def runner(engine, engine_request):
        if engine.info().id == "primary":
            raise RuntimeError("primary failed")
        return await engine.synthesize(engine_request)

    result = await orchestrator.synthesize(request(), runner)

    assert result.engine_id == "backup"
    assert result.attempted_engine_ids == ["primary", "backup"]
    assert result.fallback_used is True


@pytest.mark.asyncio
async def test_repeated_failures_open_circuit_and_skip_engine():
    registry = EngineRegistry()
    registry.register_tts(FakeEngine("primary"))
    registry.register_tts(FakeEngine("backup"))
    orchestrator = EngineOrchestrator(
        registry,
        preferred_order=["primary", "backup"],
        failure_threshold=1,
        cooldown_seconds=60,
    )

    async def runner(engine, engine_request):
        if engine.info().id == "primary":
            raise RuntimeError("primary failed")
        return await engine.synthesize(engine_request)

    first = await orchestrator.synthesize(request(), runner)
    second = await orchestrator.synthesize(request(), runner)

    assert first.attempted_engine_ids == ["primary", "backup"]
    assert second.attempted_engine_ids == ["backup"]
    runtime = {item.id: item for item in orchestrator.list_info()}
    assert runtime["primary"].health == "cooldown"
    assert runtime["primary"].failure_count == 1
    assert runtime["backup"].success_count == 2


@pytest.mark.asyncio
async def test_explicit_unknown_engine_is_rejected_without_fallback():
    registry = EngineRegistry()
    registry.register_tts(FakeEngine("backup"))
    orchestrator = EngineOrchestrator(registry)

    with pytest.raises(EngineUnavailableError):
        await orchestrator.synthesize(
            request("missing"),
            lambda engine, engine_request: engine.synthesize(engine_request),
        )


@pytest.mark.asyncio
async def test_ready_engine_rejects_unsupported_output_format():
    registry = EngineRegistry()
    registry.register_tts(FakeEngine("primary"))
    orchestrator = EngineOrchestrator(registry)
    unsupported = request("auto").model_copy(update={"output_format": "mp3"})

    with pytest.raises(EngineRequestUnsupportedError):
        await orchestrator.synthesize(
            unsupported,
            lambda engine, engine_request: engine.synthesize(engine_request),
        )


@pytest.mark.asyncio
async def test_all_failures_report_attempted_engines():
    registry = EngineRegistry()
    registry.register_tts(FakeEngine("primary"))
    registry.register_tts(FakeEngine("backup", mode="local"))
    orchestrator = EngineOrchestrator(
        registry,
        preferred_order=["primary", "backup"],
    )

    async def fail(engine, engine_request):
        raise RuntimeError(f"{engine.info().id} unavailable")

    with pytest.raises(EngineExhaustedError) as raised:
        await orchestrator.synthesize(request(), fail)

    assert raised.value.attempts == ["primary", "backup"]
    assert len(raised.value.errors) == 2


@pytest.mark.asyncio
async def test_all_open_circuits_fail_fast_without_retrying_engine():
    now = 100.0
    registry = EngineRegistry()
    registry.register_tts(FakeEngine("primary"))
    orchestrator = EngineOrchestrator(
        registry,
        failure_threshold=1,
        cooldown_seconds=30,
        clock=lambda: now,
    )
    calls = 0

    async def fail(engine, engine_request):
        nonlocal calls
        calls += 1
        raise RuntimeError("primary failed")

    with pytest.raises(EngineExhaustedError):
        await orchestrator.synthesize(request(), fail)
    with pytest.raises(EngineUnavailableError, match="장애 격리"):
        await orchestrator.synthesize(request(), fail)

    assert calls == 1


@pytest.mark.asyncio
async def test_engine_is_reconsidered_after_cooldown_expires():
    clock = {"now": 100.0}
    registry = EngineRegistry()
    registry.register_tts(FakeEngine("primary"))
    registry.register_tts(FakeEngine("backup", mode="local"))
    orchestrator = EngineOrchestrator(
        registry,
        preferred_order=["primary", "backup"],
        failure_threshold=1,
        cooldown_seconds=30,
        clock=lambda: clock["now"],
    )
    should_fail = True

    async def runner(engine, engine_request):
        nonlocal should_fail
        if engine.info().id == "primary" and should_fail:
            should_fail = False
            raise RuntimeError("primary failed")
        return await engine.synthesize(engine_request)

    first = await orchestrator.synthesize(request(), runner)
    clock["now"] += 31
    second = await orchestrator.synthesize(request(), runner)

    assert first.engine_id == "backup"
    assert second.engine_id == "primary"
    assert second.attempted_engine_ids == ["primary"]


def test_unavailable_engine_is_never_marked_recommended():
    registry = EngineRegistry()
    registry.register_tts(FakeEngine("offline", ready=False))
    orchestrator = EngineOrchestrator(registry)

    info = orchestrator.list_info()

    assert info[0].health == "unavailable"
    assert info[0].recommended is False


def test_configured_order_is_authoritative_across_engine_modes():
    registry = EngineRegistry()
    registry.register_tts(FakeEngine("ai", mode="ai"))
    registry.register_tts(FakeEngine("local", mode="local"))
    orchestrator = EngineOrchestrator(
        registry,
        preferred_order=["local", "ai"],
    )

    info = orchestrator.list_info()

    assert [item.id for item in info] == ["local", "ai"]
    assert info[0].recommended is True


@pytest.mark.asyncio
async def test_requested_emotion_prefers_capable_korean_engine():
    registry = EngineRegistry()
    registry.register_tts(FakeEngine("reference", supports_emotion=False))
    registry.register_tts(FakeEngine("korean-premium", supports_emotion=True))
    orchestrator = EngineOrchestrator(
        registry,
        preferred_order=["reference", "korean-premium"],
    )
    emotional = request().model_copy(update={"emotion": "happy"})

    result = await orchestrator.synthesize(
        emotional,
        lambda engine, engine_request: engine.synthesize(engine_request),
    )

    assert result.engine_id == "korean-premium"


@pytest.mark.asyncio
async def test_preset_incompatibility_falls_back_without_opening_engine_circuit():
    registry = EngineRegistry()
    registry.register_tts(FakeEngine("single-speaker"))
    registry.register_tts(FakeEngine("compatible"))
    orchestrator = EngineOrchestrator(
        registry,
        preferred_order=["single-speaker", "compatible"],
        failure_threshold=1,
    )

    async def runner(engine, engine_request):
        if engine.info().id == "single-speaker":
            raise VoicePresetUnavailableError("남성 프리셋용 화자가 없습니다.")
        return await engine.synthesize(engine_request)

    result = await orchestrator.synthesize(request(), runner)
    runtime = {item.id: item for item in orchestrator.list_info()}

    assert result.engine_id == "compatible"
    assert result.attempted_engine_ids == ["single-speaker", "compatible"]
    assert runtime["single-speaker"].failure_count == 0
    assert runtime["single-speaker"].health == "ready"


@pytest.mark.asyncio
async def test_all_preset_incompatible_engines_return_unsupported_without_circuit_failure():
    registry = EngineRegistry()
    registry.register_tts(FakeEngine("single-speaker"))
    orchestrator = EngineOrchestrator(registry, failure_threshold=1)

    async def incompatible(engine, engine_request):
        raise VoicePresetUnavailableError("요청 프리셋 성별과 맞는 화자가 없습니다.")

    with pytest.raises(EngineRequestUnsupportedError, match="프리셋 성별"):
        await orchestrator.synthesize(request(), incompatible)

    runtime = {item.id: item for item in orchestrator.list_info()}
    assert runtime["single-speaker"].failure_count == 0
    assert runtime["single-speaker"].health == "ready"


@pytest.mark.asyncio
async def test_explicit_engine_respects_open_circuit_without_hammering_runner():
    registry = EngineRegistry()
    registry.register_tts(FakeEngine("primary"))
    orchestrator = EngineOrchestrator(
        registry,
        failure_threshold=1,
        cooldown_seconds=60,
    )
    calls = 0

    async def fail(engine, engine_request):
        nonlocal calls
        calls += 1
        raise RuntimeError("primary failed")

    with pytest.raises(EngineExhaustedError):
        await orchestrator.synthesize(request("primary"), fail)
    with pytest.raises(EngineUnavailableError, match="장애 격리"):
        await orchestrator.synthesize(request("primary"), fail)

    assert calls == 1


@pytest.mark.asyncio
async def test_half_open_allows_only_one_probe_while_other_request_uses_backup():
    import asyncio

    clock = {"now": 100.0}
    registry = EngineRegistry()
    registry.register_tts(FakeEngine("primary"))
    registry.register_tts(FakeEngine("backup", mode="local"))
    orchestrator = EngineOrchestrator(
        registry,
        preferred_order=["primary", "backup"],
        failure_threshold=1,
        cooldown_seconds=10,
        clock=lambda: clock["now"],
    )

    async def initial_runner(engine, engine_request):
        if engine.info().id == "primary":
            raise RuntimeError("primary failed")
        return await engine.synthesize(engine_request)

    await orchestrator.synthesize(request(), initial_runner)
    clock["now"] = 111.0
    probe_started = asyncio.Event()
    release_probe = asyncio.Event()

    async def recovery_runner(engine, engine_request):
        if engine.info().id == "primary":
            probe_started.set()
            await release_probe.wait()
        return await engine.synthesize(engine_request)

    first_task = asyncio.create_task(orchestrator.synthesize(request(), recovery_runner))
    await probe_started.wait()
    during_probe = {item.id: item for item in orchestrator.list_info()}
    second = await orchestrator.synthesize(request(), recovery_runner)
    release_probe.set()
    first = await first_task

    assert during_probe["primary"].health == "probing"
    assert second.engine_id == "backup"
    assert second.attempted_engine_ids == ["backup"]
    assert first.engine_id == "primary"
    assert first.attempted_engine_ids == ["primary"]


@pytest.mark.asyncio
async def test_repeated_probe_failure_uses_bounded_exponential_backoff():
    clock = {"now": 100.0}
    registry = EngineRegistry()
    registry.register_tts(FakeEngine("primary"))
    orchestrator = EngineOrchestrator(
        registry,
        failure_threshold=1,
        cooldown_seconds=10,
        max_cooldown_seconds=25,
        clock=lambda: clock["now"],
    )

    async def fail(engine, engine_request):
        raise RuntimeError("still down")

    with pytest.raises(EngineExhaustedError):
        await orchestrator.synthesize(request(), fail)
    first = orchestrator.list_info()[0]
    assert first.cooldown_remaining_seconds == 10
    assert first.circuit_open_count == 1

    clock["now"] = 111.0
    with pytest.raises(EngineExhaustedError):
        await orchestrator.synthesize(request(), fail)
    second = orchestrator.list_info()[0]
    assert second.cooldown_remaining_seconds == 20
    assert second.circuit_open_count == 2

    clock["now"] = 132.0
    with pytest.raises(EngineExhaustedError):
        await orchestrator.synthesize(request(), fail)
    third = orchestrator.list_info()[0]
    assert third.cooldown_remaining_seconds == 25
    assert third.circuit_open_count == 3


@pytest.mark.asyncio
async def test_success_records_runtime_metrics_and_resets_backoff_level():
    clock = {"now": 10.0}
    registry = EngineRegistry()
    registry.register_tts(FakeEngine("primary"))
    orchestrator = EngineOrchestrator(
        registry,
        failure_threshold=1,
        cooldown_seconds=5,
        clock=lambda: clock["now"],
    )

    async def fail(engine, engine_request):
        clock["now"] += 0.2
        raise RuntimeError("temporary")

    with pytest.raises(EngineExhaustedError):
        await orchestrator.synthesize(request(), fail)
    clock["now"] += 6

    async def recover(engine, engine_request):
        clock["now"] += 0.15
        return await engine.synthesize(engine_request)

    await orchestrator.synthesize(request(), recover)
    info = orchestrator.list_info()[0]

    assert info.health == "ready"
    assert info.success_count == 1
    assert info.failure_count == 1
    assert info.attempt_count == 2
    assert info.success_rate == 0.5
    assert info.average_latency_ms == 175.0
    assert info.last_latency_ms == 150.0
    assert info.circuit_open_count == 1
    assert info.last_success_at is not None
    assert info.last_failure_at is not None


@pytest.mark.asyncio
async def test_runtime_reset_clears_circuit_and_counters():
    registry = EngineRegistry()
    registry.register_tts(FakeEngine("primary"))
    orchestrator = EngineOrchestrator(
        registry,
        failure_threshold=1,
        cooldown_seconds=60,
    )

    async def fail(engine, engine_request):
        raise RuntimeError("temporary")

    with pytest.raises(EngineExhaustedError):
        await orchestrator.synthesize(request(), fail)
    before = orchestrator.list_info()[0]
    after = await orchestrator.reset_runtime("primary")

    assert before.health == "cooldown"
    assert after.health == "ready"
    assert after.failure_count == 0
    assert after.circuit_open_count == 0
    assert after.last_error is None


@pytest.mark.asyncio
async def test_runtime_reset_rejects_engine_with_active_synthesis():
    import asyncio

    registry = EngineRegistry()
    registry.register_tts(FakeEngine("primary"))
    orchestrator = EngineOrchestrator(registry)
    started = asyncio.Event()
    release = asyncio.Event()

    async def runner(engine, engine_request):
        started.set()
        await release.wait()
        return await engine.synthesize(engine_request)

    task = asyncio.create_task(orchestrator.synthesize(request(), runner))
    await started.wait()

    with pytest.raises(EngineRuntimeBusyError, match="실행 중인 합성"):
        await orchestrator.reset_runtime("primary")

    release.set()
    result = await task
    assert result.engine_id == "primary"


@pytest.mark.asyncio
async def test_runtime_refresh_blocks_new_synthesis_until_maintenance_finishes():
    import asyncio

    refresh_started = asyncio.Event()
    release_refresh = asyncio.Event()

    class RefreshingEngine(FakeEngine):
        async def refresh_runtime(self):
            refresh_started.set()
            await release_refresh.wait()

    registry = EngineRegistry()
    registry.register_tts(RefreshingEngine("primary"))
    registry.register_tts(FakeEngine("backup", mode="local"))
    orchestrator = EngineOrchestrator(
        registry,
        preferred_order=["primary", "backup"],
    )

    reset_task = asyncio.create_task(orchestrator.reset_runtime("primary"))
    await refresh_started.wait()
    during = {item.id: item for item in orchestrator.list_info()}
    result = await orchestrator.synthesize(
        request(),
        lambda engine, engine_request: engine.synthesize(engine_request),
    )

    assert during["primary"].health == "probing"
    assert result.engine_id == "backup"
    assert result.attempted_engine_ids == ["backup"]

    release_refresh.set()
    refreshed = await reset_task
    assert refreshed.health == "ready"


@pytest.mark.asyncio
async def test_recent_failure_temporarily_deprioritizes_engine_before_circuit_opens():
    clock = {"now": 100.0}
    registry = EngineRegistry()
    registry.register_tts(FakeEngine("primary"))
    registry.register_tts(FakeEngine("backup", mode="local"))
    orchestrator = EngineOrchestrator(
        registry,
        preferred_order=["primary", "backup"],
        failure_threshold=2,
        soft_degrade_seconds=15,
        clock=lambda: clock["now"],
    )
    primary_calls = 0

    async def runner(engine, engine_request):
        nonlocal primary_calls
        if engine.info().id == "primary":
            primary_calls += 1
            if primary_calls == 1:
                raise RuntimeError("temporary primary failure")
        return await engine.synthesize(engine_request)

    first = await orchestrator.synthesize(request(), runner)
    after_failure = {item.id: item for item in orchestrator.list_info()}
    second = await orchestrator.synthesize(request(), runner)

    assert first.engine_id == "backup"
    assert after_failure["primary"].health == "ready"
    assert after_failure["primary"].selection_penalty == 20
    assert after_failure["primary"].degraded_remaining_seconds == 15
    assert after_failure["primary"].recommended is False
    assert after_failure["backup"].recommended is True
    assert second.engine_id == "backup"
    assert second.attempted_engine_ids == ["backup"]
    assert primary_calls == 1

    clock["now"] += 16
    third = await orchestrator.synthesize(request(), runner)
    recovered = {item.id: item for item in orchestrator.list_info()}

    assert third.engine_id == "primary"
    assert third.attempted_engine_ids == ["primary"]
    assert primary_calls == 2
    assert recovered["primary"].selection_penalty == 0
    assert recovered["primary"].degraded_remaining_seconds == 0


@pytest.mark.asyncio
async def test_explicit_engine_can_probe_soft_degraded_runtime_and_clear_penalty():
    clock = {"now": 50.0}
    registry = EngineRegistry()
    registry.register_tts(FakeEngine("primary"))
    registry.register_tts(FakeEngine("backup", mode="local"))
    orchestrator = EngineOrchestrator(
        registry,
        preferred_order=["primary", "backup"],
        failure_threshold=2,
        soft_degrade_seconds=30,
        clock=lambda: clock["now"],
    )
    fail_once = True

    async def runner(engine, engine_request):
        nonlocal fail_once
        if engine.info().id == "primary" and fail_once:
            fail_once = False
            raise RuntimeError("temporary")
        return await engine.synthesize(engine_request)

    await orchestrator.synthesize(request(), runner)
    degraded = {item.id: item for item in orchestrator.list_info()}
    assert degraded["primary"].selection_penalty == 20

    result = await orchestrator.synthesize(request("primary"), runner)
    recovered = {item.id: item for item in orchestrator.list_info()}

    assert result.engine_id == "primary"
    assert recovered["primary"].selection_penalty == 0
    assert recovered["primary"].consecutive_failures == 0

@pytest.mark.asyncio
async def test_recent_slow_samples_temporarily_deprioritize_auto_engine():
    clock = {"now": 100.0}
    registry = EngineRegistry()
    registry.register_tts(FakeEngine("primary"))
    registry.register_tts(FakeEngine("backup"))
    orchestrator = EngineOrchestrator(
        registry,
        preferred_order=["primary", "backup"],
        soft_degrade_seconds=0,
        performance_min_samples=4,
        performance_window_seconds=120,
        clock=lambda: clock["now"],
    )

    async def slow_primary_runner(engine, engine_request):
        if engine.info().id == "primary":
            clock["now"] += 4.2
        return await engine.synthesize(engine_request)

    for _ in range(4):
        result = await orchestrator.synthesize(request("primary"), slow_primary_runner)
        assert result.engine_id == "primary"

    runtime = {item.id: item for item in orchestrator.list_info()}
    auto_result = await orchestrator.synthesize(
        request(),
        lambda engine, engine_request: engine.synthesize(engine_request),
    )

    assert runtime["primary"].selection_penalty == 10
    assert "최근 지연" in (runtime["primary"].selection_reason or "")
    assert runtime["backup"].recommended is True
    assert auto_result.engine_id == "backup"

    clock["now"] += 121
    recovered = {item.id: item for item in orchestrator.list_info()}
    assert recovered["primary"].selection_penalty == 0
    assert recovered["primary"].recommended is True

@pytest.mark.asyncio
async def test_performance_window_expiry_resets_old_ewma_samples_before_new_observation():
    clock = {"now": 100.0}
    registry = EngineRegistry()
    registry.register_tts(FakeEngine("primary"))
    registry.register_tts(FakeEngine("backup"))
    orchestrator = EngineOrchestrator(
        registry,
        preferred_order=["primary", "backup"],
        soft_degrade_seconds=0,
        performance_min_samples=4,
        performance_window_seconds=120,
        clock=lambda: clock["now"],
    )

    async def slow_primary_runner(engine, engine_request):
        if engine.info().id == "primary":
            clock["now"] += 4.2
        return await engine.synthesize(engine_request)

    for _ in range(4):
        await orchestrator.synthesize(request("primary"), slow_primary_runner)

    degraded = {item.id: item for item in orchestrator.list_info()}
    assert degraded["primary"].selection_penalty == 10

    clock["now"] += 121
    await orchestrator.synthesize(
        request("primary"),
        lambda engine, engine_request: engine.synthesize(engine_request),
    )
    refreshed = {item.id: item for item in orchestrator.list_info()}

    assert refreshed["primary"].selection_penalty == 0
    state = orchestrator._runtime["primary"]
    assert state.performance_sample_count == 1
    assert state.latency_ewma_ms is not None
    assert state.latency_ewma_ms < 100
