import asyncio

import pytest

from app.services.job_manager import GenerationTimeoutError, JobConflictError, JobManager


@pytest.mark.asyncio
async def test_job_manager_joins_duplicate_job_ids_with_same_request_key():
    manager = JobManager(max_concurrent=1, timeout_seconds=1)
    started = asyncio.Event()
    release = asyncio.Event()
    executions = 0

    async def slow_job():
        nonlocal executions
        executions += 1
        started.set()
        await release.wait()
        return "done"

    first = asyncio.create_task(manager.run("same", slow_job, request_key="request-a"))
    await started.wait()
    second = asyncio.create_task(manager.run("same", slow_job, request_key="request-a"))
    release.set()

    assert await first == "done"
    assert await second == "done"
    assert executions == 1


@pytest.mark.asyncio
async def test_job_manager_rejects_job_id_reuse_for_different_request():
    manager = JobManager(max_concurrent=1, timeout_seconds=1)

    async def job():
        return "done"

    assert await manager.run("same", job, request_key="request-a") == "done"
    with pytest.raises(JobConflictError):
        await manager.run("same", job, request_key="request-b")


@pytest.mark.asyncio
async def test_job_manager_returns_completed_result_without_regeneration():
    manager = JobManager(max_concurrent=1, timeout_seconds=1)
    executions = 0

    async def job():
        nonlocal executions
        executions += 1
        return "done"

    assert await manager.run("completed", job, request_key="request-a") == "done"
    assert await manager.run("completed", job, request_key="request-a") == "done"
    assert executions == 1


@pytest.mark.asyncio
async def test_caller_cancellation_does_not_cancel_background_generation():
    manager = JobManager(max_concurrent=1, timeout_seconds=1)
    started = asyncio.Event()
    release = asyncio.Event()

    async def slow_job():
        started.set()
        await release.wait()
        return "done"

    caller = asyncio.create_task(manager.run("mobile-drop", slow_job, request_key="request-a"))
    await started.wait()
    caller.cancel()
    with pytest.raises(asyncio.CancelledError):
        await caller

    snapshot = await manager.get("mobile-drop")
    assert snapshot is not None
    assert snapshot.status == "processing"

    release.set()
    for _ in range(20):
        result = await manager.get_result("mobile-drop")
        if result is not None:
            break
        await asyncio.sleep(0)

    assert await manager.get_result("mobile-drop") == "done"
    completed = await manager.get("mobile-drop")
    assert completed is not None
    assert completed.status == "completed"


@pytest.mark.asyncio
async def test_job_manager_times_out():
    manager = JobManager(max_concurrent=1, timeout_seconds=0.01)

    async def never_finishes():
        await asyncio.sleep(1)

    with pytest.raises(GenerationTimeoutError) as captured:
        await manager.run("timeout", never_finishes)

    assert captured.value.args == ("timeout",)
    snapshot = await manager.get("timeout")
    assert snapshot is not None
    assert snapshot.status == "failed"
    assert snapshot.phase == "failed"
    assert snapshot.error == "generation-timeout"
    assert await manager.cancel("timeout") is False


@pytest.mark.asyncio
async def test_job_manager_cancels_running_job():
    manager = JobManager(max_concurrent=1, timeout_seconds=1)
    started = asyncio.Event()

    async def slow_job():
        started.set()
        await asyncio.sleep(1)

    task = asyncio.create_task(manager.run("cancel-me", slow_job))
    await started.wait()
    assert await manager.cancel("cancel-me") is True
    with pytest.raises(asyncio.CancelledError):
        await task


@pytest.mark.asyncio
async def test_job_manager_keeps_progress_snapshot_after_completion():
    manager = JobManager(max_concurrent=1, timeout_seconds=1)

    async def job():
        await manager.update(
            "progress-job",
            status="processing",
            phase="generating",
            progress=55,
            current_segment=2,
            total_segments=4,
            message="두 번째 구간 생성 중",
        )
        return "done"

    assert await manager.run("progress-job", job) == "done"
    snapshot = await manager.get("progress-job")
    assert snapshot is not None
    assert snapshot.status == "completed"
    assert snapshot.progress == 100
    assert snapshot.current_segment == 2
    assert snapshot.total_segments == 4


@pytest.mark.asyncio
async def test_job_manager_marks_cancelled_snapshot():
    manager = JobManager(max_concurrent=1, timeout_seconds=1)
    started = asyncio.Event()

    async def slow_job():
        started.set()
        await asyncio.sleep(1)

    task = asyncio.create_task(manager.run("cancel-progress", slow_job))
    await started.wait()
    assert await manager.cancel("cancel-progress") is True
    with pytest.raises(asyncio.CancelledError):
        await task
    snapshot = await manager.get("cancel-progress")
    assert snapshot is not None
    assert snapshot.phase == "cancelled"
    assert snapshot.status == "cancelled"
