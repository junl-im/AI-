from __future__ import annotations

import asyncio
import time
from dataclasses import dataclass
from typing import Literal, Protocol

from app.schemas.tts import JobProgressResponse

ClaimState = Literal["claimed", "busy", "completed", "expired", "conflict"]


@dataclass(frozen=True)
class JobClaim:
    state: ClaimState
    snapshot: JobProgressResponse | None = None
    result: object | None = None
    claim_expires_at: float | None = None


@dataclass(frozen=True)
class JobCleanupStats:
    expired_results: int = 0
    deleted_jobs: int = 0


class JobStore(Protocol):
    async def initialize(self) -> None: ...

    async def claim(
        self,
        *,
        job_id: str,
        request_key: str,
        owner_id: str,
        lease_seconds: float,
        initial_snapshot: JobProgressResponse,
    ) -> JobClaim: ...

    async def update_snapshot(
        self,
        job_id: str,
        owner_id: str,
        snapshot: JobProgressResponse,
    ) -> bool: ...

    async def complete(
        self,
        *,
        job_id: str,
        owner_id: str,
        snapshot: JobProgressResponse,
        result: object,
        result_ttl_seconds: float,
        history_ttl_seconds: float,
    ) -> bool: ...

    async def finish(
        self,
        *,
        job_id: str,
        owner_id: str,
        snapshot: JobProgressResponse,
        history_ttl_seconds: float,
    ) -> bool: ...

    async def get_snapshot(self, job_id: str) -> JobProgressResponse | None: ...

    async def get_result(self, job_id: str) -> object | None: ...

    async def request_cancel(
        self,
        job_id: str,
        history_ttl_seconds: float,
    ) -> bool: ...

    async def is_cancel_requested(self, job_id: str, owner_id: str) -> bool: ...

    async def cleanup_expired(self) -> JobCleanupStats: ...


@dataclass
class _MemoryRecord:
    request_key: str
    snapshot: JobProgressResponse
    owner_id: str | None
    claim_expires_at: float | None
    result: object | None = None
    result_expires_at: float | None = None
    record_expires_at: float | None = None
    cancel_requested: bool = False


class MemoryJobStore:
    def __init__(self, history_limit: int = 100) -> None:
        self._history_limit = max(10, history_limit)
        self._records: dict[str, _MemoryRecord] = {}
        self._lock = asyncio.Lock()

    async def initialize(self) -> None:
        return None

    async def claim(
        self,
        *,
        job_id: str,
        request_key: str,
        owner_id: str,
        lease_seconds: float,
        initial_snapshot: JobProgressResponse,
    ) -> JobClaim:
        async with self._lock:
            now = time.time()
            self._cleanup_locked(now)
            record = self._records.get(job_id)
            if record is None:
                claim_expires_at = now + lease_seconds
                self._records[job_id] = _MemoryRecord(
                    request_key=request_key,
                    snapshot=initial_snapshot,
                    owner_id=owner_id,
                    claim_expires_at=claim_expires_at,
                )
                self._trim_locked()
                return JobClaim(
                    state="claimed",
                    snapshot=initial_snapshot,
                    claim_expires_at=claim_expires_at,
                )

            if record.request_key != request_key:
                return JobClaim(state="conflict", snapshot=record.snapshot)

            if record.snapshot.phase == "completed":
                if self._result_available(record, now):
                    return JobClaim(
                        state="completed",
                        snapshot=record.snapshot,
                        result=record.result,
                    )
                return JobClaim(state="expired", snapshot=record.snapshot)

            if (
                record.owner_id is not None
                and record.claim_expires_at is not None
                and record.claim_expires_at > now
            ):
                return JobClaim(
                    state="busy",
                    snapshot=record.snapshot,
                    claim_expires_at=record.claim_expires_at,
                )

            claim_expires_at = now + lease_seconds
            record.snapshot = initial_snapshot
            record.owner_id = owner_id
            record.claim_expires_at = claim_expires_at
            record.result = None
            record.result_expires_at = None
            record.record_expires_at = None
            record.cancel_requested = False
            return JobClaim(
                state="claimed",
                snapshot=initial_snapshot,
                claim_expires_at=claim_expires_at,
            )

    async def update_snapshot(
        self,
        job_id: str,
        owner_id: str,
        snapshot: JobProgressResponse,
    ) -> bool:
        async with self._lock:
            record = self._records.get(job_id)
            if record is None or record.owner_id != owner_id:
                return False
            if record.cancel_requested and snapshot.phase != "cancelled":
                return False
            record.snapshot = snapshot
            return True

    async def complete(
        self,
        *,
        job_id: str,
        owner_id: str,
        snapshot: JobProgressResponse,
        result: object,
        result_ttl_seconds: float,
        history_ttl_seconds: float,
    ) -> bool:
        async with self._lock:
            record = self._records.get(job_id)
            if (
                record is None
                or record.owner_id != owner_id
                or record.cancel_requested
            ):
                return False
            now = time.time()
            record.snapshot = snapshot
            record.result = result
            record.owner_id = None
            record.claim_expires_at = None
            record.result_expires_at = now + result_ttl_seconds
            record.record_expires_at = now + history_ttl_seconds
            return True

    async def finish(
        self,
        *,
        job_id: str,
        owner_id: str,
        snapshot: JobProgressResponse,
        history_ttl_seconds: float,
    ) -> bool:
        async with self._lock:
            record = self._records.get(job_id)
            if record is None or record.owner_id != owner_id:
                return False
            record.snapshot = snapshot
            record.owner_id = None
            record.claim_expires_at = None
            record.result = None
            record.result_expires_at = None
            record.record_expires_at = time.time() + history_ttl_seconds
            record.cancel_requested = False
            return True

    async def get_snapshot(self, job_id: str) -> JobProgressResponse | None:
        async with self._lock:
            self._cleanup_locked(time.time())
            record = self._records.get(job_id)
            return record.snapshot if record is not None else None

    async def get_result(self, job_id: str) -> object | None:
        async with self._lock:
            now = time.time()
            self._cleanup_locked(now)
            record = self._records.get(job_id)
            if record is None or not self._result_available(record, now):
                return None
            return record.result

    async def request_cancel(
        self,
        job_id: str,
        history_ttl_seconds: float,
    ) -> bool:
        async with self._lock:
            record = self._records.get(job_id)
            if record is None or record.snapshot.phase not in {
                "queued",
                "normalizing",
                "generating",
                "merging",
            }:
                return False
            record.cancel_requested = True
            record.record_expires_at = time.time() + history_ttl_seconds
            record.snapshot = record.snapshot.model_copy(
                update={
                    "status": "cancelled",
                    "phase": "cancelled",
                    "message": "생성 취소를 요청했습니다.",
                    "updated_at": utc_now(),
                }
            )
            return True

    async def is_cancel_requested(self, job_id: str, owner_id: str) -> bool:
        async with self._lock:
            record = self._records.get(job_id)
            return bool(
                record is not None
                and record.owner_id == owner_id
                and record.cancel_requested
            )

    async def cleanup_expired(self) -> JobCleanupStats:
        async with self._lock:
            return self._cleanup_locked(time.time())

    def _cleanup_locked(self, now: float) -> JobCleanupStats:
        expired_results = 0
        deleted_jobs = 0
        for record in self._records.values():
            if (
                record.result is not None
                and record.result_expires_at is not None
                and record.result_expires_at <= now
            ):
                record.result = None
                record.result_expires_at = None
                expired_results += 1
        expired_ids = [
            job_id
            for job_id, record in self._records.items()
            if record.record_expires_at is not None
            and record.record_expires_at <= now
            and record.owner_id is None
        ]
        for job_id in expired_ids:
            self._records.pop(job_id, None)
            deleted_jobs += 1
        return JobCleanupStats(
            expired_results=expired_results,
            deleted_jobs=deleted_jobs,
        )

    def _trim_locked(self) -> None:
        overflow = len(self._records) - self._history_limit
        if overflow <= 0:
            return
        removable = [
            job_id
            for job_id, record in self._records.items()
            if record.owner_id is None
        ]
        for job_id in removable[:overflow]:
            self._records.pop(job_id, None)

    @staticmethod
    def _result_available(record: _MemoryRecord, now: float) -> bool:
        return bool(
            record.result is not None
            and (
                record.result_expires_at is None
                or record.result_expires_at > now
            )
        )




def utc_now() -> str:
    from datetime import datetime, timezone

    return datetime.now(timezone.utc).isoformat()
