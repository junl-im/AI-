from __future__ import annotations

import asyncio
import json
import sqlite3
import time
from contextlib import closing
from pathlib import Path

from app.schemas.tts import JobProgressResponse
from app.services.job_result_codec import decode_result, encode_result
from app.services.job_store import JobClaim, JobCleanupStats, utc_now


class SQLiteJobStore:
    def __init__(self, path: Path) -> None:
        self.path = path

    async def initialize(self) -> None:
        await asyncio.to_thread(self._initialize_sync)

    async def claim(
        self,
        *,
        job_id: str,
        request_key: str,
        owner_id: str,
        lease_seconds: float,
        initial_snapshot: JobProgressResponse,
    ) -> JobClaim:
        return await asyncio.to_thread(
            self._claim_sync,
            job_id,
            request_key,
            owner_id,
            lease_seconds,
            initial_snapshot,
        )

    async def update_snapshot(
        self,
        job_id: str,
        owner_id: str,
        snapshot: JobProgressResponse,
    ) -> bool:
        return await asyncio.to_thread(
            self._update_snapshot_sync,
            job_id,
            owner_id,
            snapshot,
        )

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
        return await asyncio.to_thread(
            self._complete_sync,
            job_id,
            owner_id,
            snapshot,
            result,
            result_ttl_seconds,
            history_ttl_seconds,
        )

    async def finish(
        self,
        *,
        job_id: str,
        owner_id: str,
        snapshot: JobProgressResponse,
        history_ttl_seconds: float,
    ) -> bool:
        return await asyncio.to_thread(
            self._finish_sync,
            job_id,
            owner_id,
            snapshot,
            history_ttl_seconds,
        )

    async def get_snapshot(self, job_id: str) -> JobProgressResponse | None:
        return await asyncio.to_thread(self._get_snapshot_sync, job_id)

    async def get_result(self, job_id: str) -> object | None:
        return await asyncio.to_thread(self._get_result_sync, job_id)

    async def request_cancel(
        self,
        job_id: str,
        history_ttl_seconds: float,
    ) -> bool:
        return await asyncio.to_thread(
            self._request_cancel_sync,
            job_id,
            history_ttl_seconds,
        )

    async def is_cancel_requested(self, job_id: str, owner_id: str) -> bool:
        return await asyncio.to_thread(
            self._is_cancel_requested_sync,
            job_id,
            owner_id,
        )

    async def cleanup_expired(self) -> JobCleanupStats:
        return await asyncio.to_thread(self._cleanup_expired_sync)

    def _initialize_sync(self) -> None:
        self.path.parent.mkdir(parents=True, exist_ok=True)
        with closing(self._connect()) as connection:
            connection.execute("PRAGMA journal_mode=WAL")
            connection.execute("PRAGMA synchronous=NORMAL")
            connection.executescript(
                """
                CREATE TABLE IF NOT EXISTS tts_jobs (
                    job_id TEXT PRIMARY KEY,
                    request_key TEXT NOT NULL,
                    status TEXT NOT NULL,
                    phase TEXT NOT NULL,
                    progress INTEGER NOT NULL,
                    current_segment INTEGER NOT NULL,
                    total_segments INTEGER NOT NULL,
                    message TEXT NOT NULL,
                    error TEXT,
                    ready_segments_json TEXT NOT NULL DEFAULT '[]',
                    updated_at TEXT NOT NULL,
                    result_type TEXT,
                    result_json TEXT,
                    owner_id TEXT,
                    claim_expires_at REAL,
                    result_expires_at REAL,
                    record_expires_at REAL,
                    cancel_requested INTEGER NOT NULL DEFAULT 0
                );
                CREATE INDEX IF NOT EXISTS idx_tts_jobs_claim_expires
                    ON tts_jobs(claim_expires_at);
                CREATE INDEX IF NOT EXISTS idx_tts_jobs_record_expires
                    ON tts_jobs(record_expires_at);
                """
            )
            columns = {
                row["name"]
                for row in connection.execute("PRAGMA table_info(tts_jobs)")
            }
            if "ready_segments_json" not in columns:
                connection.execute(
                    "ALTER TABLE tts_jobs "
                    "ADD COLUMN ready_segments_json TEXT NOT NULL DEFAULT '[]'"
                )

    def _claim_sync(
        self,
        job_id: str,
        request_key: str,
        owner_id: str,
        lease_seconds: float,
        initial_snapshot: JobProgressResponse,
    ) -> JobClaim:
        now = time.time()
        claim_expires_at = now + lease_seconds
        with closing(self._connect()) as connection:
            connection.execute("BEGIN IMMEDIATE")
            self._cleanup_connection(connection, now)
            row = connection.execute(
                "SELECT * FROM tts_jobs WHERE job_id = ?",
                (job_id,),
            ).fetchone()
            if row is None:
                connection.execute(
                    """
                    INSERT INTO tts_jobs (
                        job_id, request_key, status, phase, progress,
                        current_segment, total_segments, message, error,
                        ready_segments_json, updated_at, owner_id, claim_expires_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    self._snapshot_insert_values(
                        job_id,
                        request_key,
                        owner_id,
                        claim_expires_at,
                        initial_snapshot,
                    ),
                )
                connection.commit()
                return JobClaim(
                    state="claimed",
                    snapshot=initial_snapshot,
                    claim_expires_at=claim_expires_at,
                )

            snapshot = self._row_to_snapshot(row)
            if row["request_key"] != request_key:
                connection.commit()
                return JobClaim(state="conflict", snapshot=snapshot)

            if row["phase"] == "completed":
                result = self._decode_live_result(row, now)
                connection.commit()
                if result is None:
                    return JobClaim(state="expired", snapshot=snapshot)
                return JobClaim(
                    state="completed",
                    snapshot=snapshot,
                    result=result,
                )

            if (
                row["owner_id"] is not None
                and row["claim_expires_at"] is not None
                and row["claim_expires_at"] > now
            ):
                connection.commit()
                return JobClaim(
                    state="busy",
                    snapshot=snapshot,
                    claim_expires_at=row["claim_expires_at"],
                )

            connection.execute(
                """
                UPDATE tts_jobs
                SET status = ?, phase = ?, progress = ?, current_segment = ?,
                    total_segments = ?, message = ?, error = ?,
                    ready_segments_json = ?, updated_at = ?,
                    result_type = NULL, result_json = NULL, owner_id = ?,
                    claim_expires_at = ?, result_expires_at = NULL,
                    record_expires_at = NULL, cancel_requested = 0
                WHERE job_id = ?
                """,
                self._snapshot_update_values(
                    initial_snapshot,
                    owner_id,
                    claim_expires_at,
                    job_id,
                ),
            )
            connection.commit()
            return JobClaim(
                state="claimed",
                snapshot=initial_snapshot,
                claim_expires_at=claim_expires_at,
            )

    def _update_snapshot_sync(
        self,
        job_id: str,
        owner_id: str,
        snapshot: JobProgressResponse,
    ) -> bool:
        with closing(self._connect()) as connection:
            cursor = connection.execute(
                """
                UPDATE tts_jobs
                SET status = ?, phase = ?, progress = ?, current_segment = ?,
                    total_segments = ?, message = ?, error = ?,
                    ready_segments_json = ?, updated_at = ?
                WHERE job_id = ? AND owner_id = ? AND cancel_requested = 0
                """,
                self._snapshot_values(snapshot) + (job_id, owner_id),
            )
            return cursor.rowcount == 1

    def _complete_sync(
        self,
        job_id: str,
        owner_id: str,
        snapshot: JobProgressResponse,
        result: object,
        result_ttl_seconds: float,
        history_ttl_seconds: float,
    ) -> bool:
        result_type, result_json = encode_result(result)
        now = time.time()
        with closing(self._connect()) as connection:
            cursor = connection.execute(
                """
                UPDATE tts_jobs
                SET status = ?, phase = ?, progress = ?, current_segment = ?,
                    total_segments = ?, message = ?, error = ?,
                    ready_segments_json = ?, updated_at = ?,
                    result_type = ?, result_json = ?, owner_id = NULL,
                    claim_expires_at = NULL, result_expires_at = ?,
                    record_expires_at = ?, cancel_requested = 0
                WHERE job_id = ? AND owner_id = ? AND cancel_requested = 0
                """,
                self._snapshot_values(snapshot)
                + (
                    result_type,
                    result_json,
                    now + result_ttl_seconds,
                    now + history_ttl_seconds,
                    job_id,
                    owner_id,
                ),
            )
            return cursor.rowcount == 1

    def _finish_sync(
        self,
        job_id: str,
        owner_id: str,
        snapshot: JobProgressResponse,
        history_ttl_seconds: float,
    ) -> bool:
        with closing(self._connect()) as connection:
            cursor = connection.execute(
                """
                UPDATE tts_jobs
                SET status = ?, phase = ?, progress = ?, current_segment = ?,
                    total_segments = ?, message = ?, error = ?,
                    ready_segments_json = ?, updated_at = ?,
                    result_type = NULL, result_json = NULL, owner_id = NULL,
                    claim_expires_at = NULL, result_expires_at = NULL,
                    record_expires_at = ?, cancel_requested = 0
                WHERE job_id = ? AND owner_id = ?
                """,
                self._snapshot_values(snapshot)
                + (
                    time.time() + history_ttl_seconds,
                    job_id,
                    owner_id,
                ),
            )
            return cursor.rowcount == 1

    def _get_snapshot_sync(self, job_id: str) -> JobProgressResponse | None:
        with closing(self._connect()) as connection:
            self._cleanup_connection(connection, time.time())
            row = connection.execute(
                "SELECT * FROM tts_jobs WHERE job_id = ?",
                (job_id,),
            ).fetchone()
            return self._row_to_snapshot(row) if row is not None else None

    def _get_result_sync(self, job_id: str) -> object | None:
        now = time.time()
        with closing(self._connect()) as connection:
            self._cleanup_connection(connection, now)
            row = connection.execute(
                "SELECT * FROM tts_jobs WHERE job_id = ?",
                (job_id,),
            ).fetchone()
            if row is None:
                return None
            return self._decode_live_result(row, now)

    def _request_cancel_sync(
        self,
        job_id: str,
        history_ttl_seconds: float,
    ) -> bool:
        now = time.time()
        with closing(self._connect()) as connection:
            cursor = connection.execute(
                """
                UPDATE tts_jobs
                SET status = 'cancelled', phase = 'cancelled',
                    message = ?, updated_at = ?, cancel_requested = 1,
                    record_expires_at = ?
                WHERE job_id = ?
                  AND phase IN ('queued', 'normalizing', 'generating', 'merging')
                """,
                (
                    "생성 취소를 요청했습니다.",
                    utc_now(),
                    now + history_ttl_seconds,
                    job_id,
                ),
            )
            return cursor.rowcount == 1

    def _is_cancel_requested_sync(self, job_id: str, owner_id: str) -> bool:
        with closing(self._connect()) as connection:
            row = connection.execute(
                """
                SELECT cancel_requested
                FROM tts_jobs
                WHERE job_id = ? AND owner_id = ?
                """,
                (job_id, owner_id),
            ).fetchone()
            return bool(row is not None and row["cancel_requested"])

    def _cleanup_expired_sync(self) -> JobCleanupStats:
        with closing(self._connect()) as connection:
            return self._cleanup_connection(connection, time.time())

    @staticmethod
    def _cleanup_connection(
        connection: sqlite3.Connection,
        now: float,
    ) -> JobCleanupStats:
        expired_results = connection.execute(
            """
            UPDATE tts_jobs
            SET result_type = NULL, result_json = NULL,
                result_expires_at = NULL
            WHERE result_json IS NOT NULL
              AND result_expires_at IS NOT NULL
              AND result_expires_at <= ?
            """,
            (now,),
        ).rowcount
        deleted_jobs = connection.execute(
            """
            DELETE FROM tts_jobs
            WHERE record_expires_at IS NOT NULL
              AND record_expires_at <= ?
              AND owner_id IS NULL
            """,
            (now,),
        ).rowcount
        return JobCleanupStats(
            expired_results=max(0, expired_results),
            deleted_jobs=max(0, deleted_jobs),
        )

    def _connect(self) -> sqlite3.Connection:
        connection = sqlite3.connect(
            self.path,
            timeout=5.0,
            isolation_level=None,
        )
        connection.row_factory = sqlite3.Row
        connection.execute("PRAGMA busy_timeout=5000")
        return connection

    @staticmethod
    def _snapshot_values(snapshot: JobProgressResponse) -> tuple[object, ...]:
        return (
            snapshot.status,
            snapshot.phase,
            snapshot.progress,
            snapshot.current_segment,
            snapshot.total_segments,
            snapshot.message,
            snapshot.error,
            json.dumps(
                [segment.model_dump() for segment in snapshot.ready_segments],
                ensure_ascii=False,
                separators=(",", ":"),
            ),
            snapshot.updated_at,
        )

    @classmethod
    def _snapshot_insert_values(
        cls,
        job_id: str,
        request_key: str,
        owner_id: str,
        claim_expires_at: float,
        snapshot: JobProgressResponse,
    ) -> tuple[object, ...]:
        return (
            job_id,
            request_key,
            *cls._snapshot_values(snapshot),
            owner_id,
            claim_expires_at,
        )

    @classmethod
    def _snapshot_update_values(
        cls,
        snapshot: JobProgressResponse,
        owner_id: str,
        claim_expires_at: float,
        job_id: str,
    ) -> tuple[object, ...]:
        return (
            *cls._snapshot_values(snapshot),
            owner_id,
            claim_expires_at,
            job_id,
        )

    @staticmethod
    def _row_to_snapshot(row: sqlite3.Row) -> JobProgressResponse:
        return JobProgressResponse(
            job_id=row["job_id"],
            status=row["status"],
            phase=row["phase"],
            progress=row["progress"],
            current_segment=row["current_segment"],
            total_segments=row["total_segments"],
            message=row["message"],
            error=row["error"],
            ready_segments=json.loads(row["ready_segments_json"] or "[]"),
            updated_at=row["updated_at"],
        )

    @staticmethod
    def _decode_live_result(row: sqlite3.Row, now: float) -> object | None:
        if row["result_json"] is None:
            return None
        if (
            row["result_expires_at"] is not None
            and row["result_expires_at"] <= now
        ):
            return None
        return decode_result(row["result_type"], row["result_json"])


