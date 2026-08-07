from __future__ import annotations

import os
import sqlite3
import time
from collections.abc import Iterator
from contextlib import contextmanager
from dataclasses import dataclass
from pathlib import Path
from typing import Protocol, runtime_checkable
from uuid import uuid4


class WriterLeaseTimeoutError(TimeoutError):
    pass


class WriterLeaseLostError(RuntimeError):
    pass


@dataclass(frozen=True)
class WriterLease:
    resource: str
    owner_id: str
    fencing_token: int
    expires_at: float


@runtime_checkable
class WriterLeaseCoordinator(Protocol):
    backend_name: str

    def acquire(
        self,
        resource: str,
        *,
        timeout_seconds: float = 10.0,
        poll_interval_seconds: float = 0.05,
    ) -> Iterator[WriterLease]: ...

    def assert_current(self, lease: WriterLease) -> None: ...

    def status(self, resource: str) -> dict[str, object]: ...


class SQLiteWriterLeaseCoordinator:
    backend_name = "sqlite"

    def __init__(self, path: Path, lease_seconds: float = 30.0) -> None:
        self.path = path
        self.path.parent.mkdir(parents=True, exist_ok=True)
        self.lease_seconds = max(5.0, lease_seconds)
        self.owner_prefix = f"{os.getpid()}-{uuid4().hex[:12]}"
        self._initialize()

    def _connect(self) -> sqlite3.Connection:
        connection = sqlite3.connect(self.path, timeout=0, isolation_level=None)
        connection.execute("PRAGMA busy_timeout = 0")
        connection.execute("PRAGMA journal_mode = WAL")
        connection.execute("PRAGMA synchronous = FULL")
        return connection

    def _initialize(self) -> None:
        with self._connect() as connection:
            connection.execute(
                """
                CREATE TABLE IF NOT EXISTS writer_leases (
                    resource TEXT PRIMARY KEY,
                    owner_id TEXT NOT NULL,
                    fencing_token INTEGER NOT NULL,
                    expires_at REAL NOT NULL,
                    updated_at REAL NOT NULL
                )
                """
            )

    @contextmanager
    def acquire(
        self,
        resource: str,
        *,
        timeout_seconds: float = 10.0,
        poll_interval_seconds: float = 0.05,
    ) -> Iterator[WriterLease]:
        normalized = resource.strip()
        if not normalized:
            raise ValueError("writer lease resource는 비어 있을 수 없습니다.")
        owner_id = f"{self.owner_prefix}-{uuid4().hex[:12]}"
        deadline = time.monotonic() + max(0.0, timeout_seconds)
        lease: WriterLease | None = None

        while lease is None:
            now = time.time()
            try:
                with self._connect() as connection:
                    connection.execute("BEGIN IMMEDIATE")
                    row = connection.execute(
                        "SELECT owner_id, fencing_token, expires_at "
                        "FROM writer_leases WHERE resource = ?",
                        (normalized,),
                    ).fetchone()
                    if row is None or float(row[2]) <= now:
                        token = int(row[1]) + 1 if row is not None else 1
                        expires_at = now + self.lease_seconds
                        connection.execute(
                            """
                            INSERT INTO writer_leases (
                                resource, owner_id, fencing_token, expires_at, updated_at
                            ) VALUES (?, ?, ?, ?, ?)
                            ON CONFLICT(resource) DO UPDATE SET
                                owner_id = excluded.owner_id,
                                fencing_token = excluded.fencing_token,
                                expires_at = excluded.expires_at,
                                updated_at = excluded.updated_at
                            """,
                            (normalized, owner_id, token, expires_at, now),
                        )
                        connection.execute("COMMIT")
                        lease = WriterLease(normalized, owner_id, token, expires_at)
                    else:
                        connection.execute("ROLLBACK")
            except sqlite3.OperationalError:
                pass

            if lease is not None:
                break
            if time.monotonic() >= deadline:
                message = (
                    f"writer lease를 {timeout_seconds:g}초 안에 얻지 못했습니다: "
                    f"{normalized}"
                )
                raise WriterLeaseTimeoutError(message)
            time.sleep(max(0.01, poll_interval_seconds))

        try:
            yield lease
        finally:
            self.release(lease)

    def assert_current(self, lease: WriterLease) -> None:
        now = time.time()
        with self._connect() as connection:
            row = connection.execute(
                "SELECT owner_id, fencing_token, expires_at "
                "FROM writer_leases WHERE resource = ?",
                (lease.resource,),
            ).fetchone()
        if (
            row is None
            or str(row[0]) != lease.owner_id
            or int(row[1]) != lease.fencing_token
            or float(row[2]) <= now
        ):
            message = (
                "writer lease가 만료되었거나 다른 writer로 교체됐습니다: "
                f"{lease.resource}"
            )
            raise WriterLeaseLostError(message)

    def release(self, lease: WriterLease) -> None:
        try:
            with self._connect() as connection:
                connection.execute("BEGIN IMMEDIATE")
                connection.execute(
                    "UPDATE writer_leases SET owner_id = '', expires_at = 0, updated_at = ? "
                    "WHERE resource = ? AND owner_id = ? AND fencing_token = ?",
                    (time.time(), lease.resource, lease.owner_id, lease.fencing_token),
                )
                connection.execute("COMMIT")
        except sqlite3.OperationalError:
            return

    def status(self, resource: str) -> dict[str, object]:
        with self._connect() as connection:
            row = connection.execute(
                "SELECT owner_id, fencing_token, expires_at, updated_at "
                "FROM writer_leases WHERE resource = ?",
                (resource,),
            ).fetchone()
        if row is None:
            return {"resource": resource, "held": False, "fencing_token": 0}
        return {
            "resource": resource,
            "held": float(row[2]) > time.time(),
            "fencing_token": int(row[1]),
            "expires_at": float(row[2]),
            "updated_at": float(row[3]),
        }

def create_writer_lease_coordinator(
    backend: str,
    *,
    sqlite_path: Path,
    lease_seconds: float = 30.0,
) -> WriterLeaseCoordinator:
    normalized = backend.strip().lower() or "sqlite"
    if normalized == "sqlite":
        return SQLiteWriterLeaseCoordinator(sqlite_path, lease_seconds)
    raise ValueError(
        "지원하지 않는 writer lease backend입니다: "
        f"{backend!r}. 현재는 sqlite만 사용할 수 있습니다."
    )

