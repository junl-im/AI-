from __future__ import annotations

import multiprocessing
import time
from pathlib import Path

import pytest

from app.services.writer_lease import (
    SQLiteWriterLeaseCoordinator,
    WriterLeaseCoordinator,
    WriterLeaseLostError,
    WriterLeaseTimeoutError,
    create_writer_lease_coordinator,
)


def _hold_lease(path: str, ready) -> None:
    coordinator = SQLiteWriterLeaseCoordinator(Path(path), lease_seconds=5.0)
    with coordinator.acquire("approval", timeout_seconds=2.0):
        ready.set()
        time.sleep(0.35)


def test_sqlite_writer_lease_serializes_processes(tmp_path) -> None:
    lease_path = tmp_path / "writer.sqlite3"
    context = multiprocessing.get_context("spawn")
    ready = context.Event()
    process = context.Process(target=_hold_lease, args=(str(lease_path), ready))
    process.start()
    try:
        assert ready.wait(3.0)
        coordinator = SQLiteWriterLeaseCoordinator(lease_path, lease_seconds=5.0)
        with pytest.raises(WriterLeaseTimeoutError):
            with coordinator.acquire(
                "approval",
                timeout_seconds=0.1,
                poll_interval_seconds=0.02,
            ):
                pass
    finally:
        process.join(timeout=3.0)
        if process.is_alive():
            process.terminate()
            process.join(timeout=1.0)

    assert process.exitcode == 0
    coordinator = SQLiteWriterLeaseCoordinator(lease_path, lease_seconds=5.0)
    with coordinator.acquire("approval", timeout_seconds=0.2) as lease:
        coordinator.assert_current(lease)
        assert lease.fencing_token >= 2


def test_expired_writer_cannot_commit_after_fencing_token_changes(tmp_path) -> None:
    coordinator = SQLiteWriterLeaseCoordinator(tmp_path / "writer.sqlite3", lease_seconds=5.0)
    with coordinator.acquire("approval", timeout_seconds=0.2) as first:
        coordinator.assert_current(first)
        with coordinator._connect() as connection:  # focused stale-writer simulation
            connection.execute(
                "UPDATE writer_leases SET expires_at = ? WHERE resource = ?",
                (time.time() - 1, first.resource),
            )
        with coordinator.acquire("approval", timeout_seconds=0.2) as second:
            assert second.fencing_token == first.fencing_token + 1
            with pytest.raises(WriterLeaseLostError):
                coordinator.assert_current(first)
            coordinator.assert_current(second)

def test_writer_lease_factory_exposes_backend_contract(tmp_path) -> None:
    coordinator = create_writer_lease_coordinator(
        "sqlite",
        sqlite_path=tmp_path / "writer.sqlite3",
        lease_seconds=5.0,
    )
    assert isinstance(coordinator, WriterLeaseCoordinator)
    assert coordinator.backend_name == "sqlite"


def test_writer_lease_factory_rejects_unknown_backend(tmp_path) -> None:
    with pytest.raises(ValueError, match="지원하지 않는 writer lease backend"):
        create_writer_lease_coordinator(
            "managed-db",
            sqlite_path=tmp_path / "writer.sqlite3",
        )

