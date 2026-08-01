import asyncio

import pytest

from app.services.job_manager import JobManager, JobResultExpiredError
from app.services.sqlite_job_store import SQLiteJobStore


@pytest.mark.asyncio
async def test_sqlite_job_store_restores_completed_result_after_restart(tmp_path):
    database = tmp_path / "jobs.sqlite3"
    first_manager = JobManager(
        max_concurrent=1,
        timeout_seconds=1,
        store=SQLiteJobStore(database),
        poll_interval_seconds=0.01,
    )

    assert await first_manager.run(
        "restart-result",
        lambda: asyncio.sleep(0, result="done"),
        request_key="request-a",
    ) == "done"

    executions = 0

    async def must_not_run():
        nonlocal executions
        executions += 1
        return "regenerated"

    restarted_manager = JobManager(
        max_concurrent=1,
        timeout_seconds=1,
        store=SQLiteJobStore(database),
        poll_interval_seconds=0.01,
    )
    assert await restarted_manager.run(
        "restart-result",
        must_not_run,
        request_key="request-a",
    ) == "done"
    assert executions == 0


@pytest.mark.asyncio
async def test_sqlite_job_store_allows_only_one_cross_process_execution(tmp_path):
    database = tmp_path / "jobs.sqlite3"
    first_manager = JobManager(
        max_concurrent=1,
        timeout_seconds=1,
        store=SQLiteJobStore(database),
        claim_ttl_seconds=1,
        poll_interval_seconds=0.01,
    )
    second_manager = JobManager(
        max_concurrent=1,
        timeout_seconds=1,
        store=SQLiteJobStore(database),
        claim_ttl_seconds=1,
        poll_interval_seconds=0.01,
    )
    started = asyncio.Event()
    release = asyncio.Event()
    executions = 0

    async def slow_job():
        nonlocal executions
        executions += 1
        started.set()
        await release.wait()
        return "done"

    first = asyncio.create_task(
        first_manager.run(
            "cross-process",
            slow_job,
            request_key="request-a",
        )
    )
    await started.wait()
    second = asyncio.create_task(
        second_manager.run(
            "cross-process",
            slow_job,
            request_key="request-a",
        )
    )
    await asyncio.sleep(0.03)
    release.set()

    assert await first == "done"
    assert await second == "done"
    assert executions == 1


@pytest.mark.asyncio
async def test_sqlite_job_store_reclaims_expired_claim(tmp_path):
    database = tmp_path / "jobs.sqlite3"
    store = SQLiteJobStore(database)
    await store.initialize()
    manager = JobManager(
        max_concurrent=1,
        timeout_seconds=1,
        store=store,
        claim_ttl_seconds=0.05,
        poll_interval_seconds=0.01,
    )
    initial = manager._snapshot(
        job_id="stale-claim",
        status="queued",
        phase="queued",
        progress=0,
        message="queued",
    )
    claimed = await store.claim(
        job_id="stale-claim",
        request_key="request-a",
        owner_id="dead-process",
        lease_seconds=0.01,
        initial_snapshot=initial,
    )
    assert claimed.state == "claimed"
    await asyncio.sleep(0.02)

    executions = 0

    async def recovered_job():
        nonlocal executions
        executions += 1
        return "recovered"

    assert await manager.run(
        "stale-claim",
        recovered_job,
        request_key="request-a",
    ) == "recovered"
    assert executions == 1


@pytest.mark.asyncio
async def test_sqlite_job_store_keeps_expired_result_tombstone(tmp_path):
    database = tmp_path / "jobs.sqlite3"
    first_manager = JobManager(
        max_concurrent=1,
        timeout_seconds=1,
        store=SQLiteJobStore(database),
        result_ttl_seconds=0.01,
        history_ttl_seconds=1,
        poll_interval_seconds=0.01,
    )
    assert await first_manager.run(
        "expired-result",
        lambda: asyncio.sleep(0, result="done"),
        request_key="request-a",
    ) == "done"
    await asyncio.sleep(0.02)

    restarted_manager = JobManager(
        max_concurrent=1,
        timeout_seconds=1,
        store=SQLiteJobStore(database),
        result_ttl_seconds=0.01,
        history_ttl_seconds=1,
        poll_interval_seconds=0.01,
    )
    with pytest.raises(JobResultExpiredError):
        await restarted_manager.run(
            "expired-result",
            lambda: asyncio.sleep(0, result="regenerated"),
            request_key="request-a",
        )
    snapshot = await restarted_manager.get("expired-result")
    assert snapshot is not None
    assert snapshot.phase == "completed"
    assert await restarted_manager.get_result("expired-result") is None


@pytest.mark.asyncio
async def test_sqlite_job_store_propagates_cancel_between_managers(tmp_path):
    database = tmp_path / "jobs.sqlite3"
    first_manager = JobManager(
        max_concurrent=1,
        timeout_seconds=1,
        store=SQLiteJobStore(database),
        poll_interval_seconds=0.01,
    )
    second_manager = JobManager(
        max_concurrent=1,
        timeout_seconds=1,
        store=SQLiteJobStore(database),
        poll_interval_seconds=0.01,
    )
    started = asyncio.Event()

    async def slow_job():
        started.set()
        await asyncio.sleep(1)

    running = asyncio.create_task(
        first_manager.run(
            "remote-cancel",
            slow_job,
            request_key="request-a",
        )
    )
    await started.wait()
    assert await second_manager.cancel("remote-cancel") is True
    with pytest.raises(asyncio.CancelledError):
        await running
    snapshot = await second_manager.get("remote-cancel")
    assert snapshot is not None
    assert snapshot.phase == "cancelled"


@pytest.mark.asyncio
async def test_sqlite_job_store_deletes_expired_history(tmp_path):
    database = tmp_path / "jobs.sqlite3"
    manager = JobManager(
        max_concurrent=1,
        timeout_seconds=1,
        store=SQLiteJobStore(database),
        result_ttl_seconds=0.01,
        history_ttl_seconds=0.02,
        poll_interval_seconds=0.01,
    )
    assert await manager.run(
        "cleanup-job",
        lambda: asyncio.sleep(0, result="done"),
        request_key="request-a",
    ) == "done"
    await asyncio.sleep(0.03)

    cleanup = await manager.cleanup_expired()
    assert cleanup.expired_results == 1
    assert cleanup.deleted_jobs == 1
    assert await manager.get("cleanup-job") is None


@pytest.mark.asyncio
async def test_sqlite_job_store_prunes_expired_history_during_read(tmp_path):
    database = tmp_path / "jobs.sqlite3"
    manager = JobManager(
        max_concurrent=1,
        timeout_seconds=1,
        store=SQLiteJobStore(database),
        result_ttl_seconds=0.01,
        history_ttl_seconds=0.02,
        poll_interval_seconds=0.01,
    )
    assert await manager.run(
        "read-cleanup-job",
        lambda: asyncio.sleep(0, result="done"),
        request_key="request-a",
    ) == "done"
    await asyncio.sleep(0.03)

    assert await manager.get("read-cleanup-job") is None
    cleanup = await manager.cleanup_expired()
    assert cleanup.expired_results == 0
    assert cleanup.deleted_jobs == 0
