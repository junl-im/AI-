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

    with pytest.raises(GenerationTimeoutError):
        await manager.run("timeout", never_finishes)


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
