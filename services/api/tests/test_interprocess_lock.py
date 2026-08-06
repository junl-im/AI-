from __future__ import annotations

import multiprocessing
import time
from pathlib import Path

import pytest

from app.services.interprocess_lock import (
    InterprocessLockTimeoutError,
    exclusive_file_lock,
)


def _hold_lock(path: str, ready) -> None:
    with exclusive_file_lock(Path(path), timeout_seconds=2.0):
        ready.set()
        time.sleep(0.35)


def test_exclusive_file_lock_blocks_another_process_and_releases(tmp_path) -> None:
    lock_path = tmp_path / "approval-history.jsonl.lock"
    context = multiprocessing.get_context("spawn")
    ready = context.Event()
    process = context.Process(target=_hold_lock, args=(str(lock_path), ready))
    process.start()
    try:
        assert ready.wait(3.0)
        with pytest.raises(InterprocessLockTimeoutError):
            with exclusive_file_lock(
                lock_path,
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
    with exclusive_file_lock(lock_path, timeout_seconds=0.2):
        assert lock_path.is_file()
