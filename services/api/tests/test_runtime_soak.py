from app.services.runtime_soak import (
    RuntimeProbeSample,
    RuntimeRecoveryEvent,
    build_runtime_soak_report,
)


def _sample(
    target: str,
    index: int,
    *,
    ok: bool = True,
    memory: float | None = None,
    descriptors: int | None = None,
    latency_ms: int | None = None,
):
    return RuntimeProbeSample(
        target=target,
        at=f"2026-08-06T00:00:{index:02d}+00:00",
        ok=ok,
        latency_ms=latency_ms if latency_ms is not None else 10 + index,
        status_code=200 if ok else None,
        memory_mb=memory,
        open_file_descriptors=descriptors,
        error=None if ok else "offline",
    )


def test_runtime_soak_report_passes_stable_api_and_worker():
    samples = [
        *[
            _sample("api", index, memory=100 + index, descriptors=20 + index)
            for index in range(5)
        ],
        *[_sample("worker", index) for index in range(5)],
    ]
    report = build_runtime_soak_report(
        app_version="0.10.3",
        started_at="2026-08-06T00:00:00+00:00",
        completed_at="2026-08-06T00:01:00+00:00",
        interval_seconds=10,
        samples=samples,
    )
    assert report["status"] == "passed"
    assert report["targets"]["api"]["memory_growth_mb"] == 4
    assert report["targets"]["api"]["open_file_descriptors_growth"] == 4
    assert report["comparison"]["status"] == "unavailable"
    assert len(report["report_sha256"]) == 64


def test_runtime_soak_report_detects_outage_and_memory_growth():
    samples = [
        _sample("api", 0, memory=100, descriptors=20),
        _sample("api", 1, ok=False),
        _sample("api", 2, ok=False),
        _sample("api", 3, memory=260, descriptors=80),
    ]
    report = build_runtime_soak_report(
        app_version="0.10.3",
        started_at="2026-08-06T00:00:00+00:00",
        completed_at="2026-08-06T00:01:00+00:00",
        interval_seconds=20,
        samples=samples,
        minimum_success_rate=0.9,
        max_outage_seconds=30,
        max_memory_growth_mb=128,
        max_open_file_descriptors_growth=32,
    )
    assert report["status"] == "failed"
    assert any("최장 중단" in reason for reason in report["reasons"])
    assert any("메모리 증가" in reason for reason in report["reasons"])
    assert any("파일·연결 증가" in reason for reason in report["reasons"])


def test_runtime_soak_report_records_worker_restart_recovery():
    event = RuntimeRecoveryEvent(
        kind="worker-restart",
        target="worker",
        started_at="2026-08-06T00:00:10+00:00",
        recovered_at="2026-08-06T00:00:18+00:00",
        ok=True,
        recovery_seconds=8.0,
    )
    report = build_runtime_soak_report(
        app_version="0.10.3",
        started_at="2026-08-06T00:00:00+00:00",
        completed_at="2026-08-06T00:01:00+00:00",
        interval_seconds=10,
        samples=[_sample("worker", index) for index in range(5)],
        recovery_events=[event],
        max_recovery_seconds=30,
    )
    assert report["status"] == "passed"
    assert report["recovery_events"][0]["kind"] == "worker-restart"


def test_runtime_soak_report_warns_when_previous_run_regresses():
    baseline = build_runtime_soak_report(
        app_version="0.10.1",
        started_at="2026-08-01T00:00:00+00:00",
        completed_at="2026-08-01T00:01:00+00:00",
        interval_seconds=10,
        samples=[_sample("api", index, latency_ms=20) for index in range(5)],
    )
    report = build_runtime_soak_report(
        app_version="0.10.3",
        started_at="2026-08-06T00:00:00+00:00",
        completed_at="2026-08-06T00:01:00+00:00",
        interval_seconds=10,
        samples=[_sample("api", index, latency_ms=180) for index in range(5)],
        baseline_report=baseline,
    )
    assert report["status"] == "warning"
    assert report["comparison"]["status"] == "regressed"
    assert any("이전 soak 대비" in warning for warning in report["warnings"])

def test_planned_worker_restart_failure_does_not_lower_success_rate():
    event = RuntimeRecoveryEvent(
        kind="worker-restart",
        target="worker",
        started_at="2026-08-06T00:00:10+00:00",
        recovered_at="2026-08-06T00:00:25+00:00",
        ok=True,
        recovery_seconds=15.0,
    )
    report = build_runtime_soak_report(
        app_version="0.10.3",
        started_at="2026-08-06T00:00:00+00:00",
        completed_at="2026-08-06T00:01:00+00:00",
        interval_seconds=10,
        samples=[
            _sample("worker", 0),
            _sample("worker", 10, ok=False),
            _sample("worker", 20, ok=False),
            _sample("worker", 30),
        ],
        recovery_events=[event],
    )
    summary = report["targets"]["worker"]
    assert report["status"] == "passed"
    assert summary["planned_recovery_failures"] == 2
    assert summary["failures"] == 0
    assert summary["success_rate"] == 1.0

