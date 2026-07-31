import asyncio

import pytest

from app.services.job_manager import GenerationTimeoutError, JobAlreadyRunningError, JobManager


@pytest.mark.asyncio
async def test_job_manager_rejects_duplicate_job_ids():
    manager = JobManager(max_concurrent=1, timeout_seconds=1)
    started = asyncio.Event()
    release = asyncio.Event()

    async def slow_job():
        started.set()
        await release.wait()
        return "done"

    first = asyncio.create_task(manager.run("same", slow_job))
    await started.wait()
    with pytest.raises(JobAlreadyRunningError):
        await manager.run("same", slow_job)
    release.set()
    assert await first == "done"


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
