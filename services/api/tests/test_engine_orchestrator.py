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
    EngineUnavailableError,
)


class FakeEngine(TtsEngine):
    def __init__(
        self,
        engine_id: str,
        mode: str = "ai",
        ready: bool = True,
        supports_emotion: bool = False,
        cost_tier: str = "free",
    ) -> None:
        self.engine_id = engine_id
        self.mode = mode
        self.ready = ready
        self.supports_emotion = supports_emotion
        self.cost_tier = cost_tier

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
            cost_tier=self.cost_tier,
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
async def test_free_only_policy_skips_ready_metered_engine():
    registry = EngineRegistry()
    registry.register_tts(FakeEngine("paid", cost_tier="metered"))
    registry.register_tts(FakeEngine("local", mode="local"))
    orchestrator = EngineOrchestrator(
        registry,
        preferred_order=["paid", "local"],
        allow_metered=False,
    )

    result = await orchestrator.synthesize(
        request(),
        lambda engine, engine_request: engine.synthesize(engine_request),
    )
    info = {item.id: item for item in orchestrator.list_info()}

    assert result.engine_id == "local"
    assert result.attempted_engine_ids == ["local"]
    assert info["paid"].auto_eligible is False
    assert info["local"].recommended is True


@pytest.mark.asyncio
async def test_balanced_policy_can_use_metered_engine():
    registry = EngineRegistry()
    registry.register_tts(FakeEngine("paid", cost_tier="metered"))
    registry.register_tts(FakeEngine("local", mode="local"))
    orchestrator = EngineOrchestrator(
        registry,
        preferred_order=["paid", "local"],
        allow_metered=True,
    )

    result = await orchestrator.synthesize(
        request(),
        lambda engine, engine_request: engine.synthesize(engine_request),
    )

    assert result.engine_id == "paid"
    assert result.attempted_engine_ids == ["paid"]


@pytest.mark.asyncio
async def test_free_only_policy_explains_when_only_metered_engine_is_ready():
    registry = EngineRegistry()
    registry.register_tts(FakeEngine("paid", cost_tier="metered"))
    orchestrator = EngineOrchestrator(registry, allow_metered=False)

    with pytest.raises(EngineUnavailableError, match="무료 우선 정책"):
        await orchestrator.synthesize(
            request(),
            lambda engine, engine_request: engine.synthesize(engine_request),
        )
