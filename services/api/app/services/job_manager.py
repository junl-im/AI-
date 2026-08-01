import asyncio
from collections.abc import Awaitable, Callable
from datetime import datetime, timezone
from typing import TypeVar, cast
from uuid import uuid4

from app.schemas.tts import JobPhase, JobProgressResponse, JobStatus
from app.services.job_store import JobCleanupStats, JobStore, MemoryJobStore

T = TypeVar("T")
JobFactory = Callable[[], Awaitable[T]]


class JobConflictError(RuntimeError):
    pass


class JobResultExpiredError(RuntimeError):
    pass


class JobLeaseLostError(RuntimeError):
    pass


class GenerationTimeoutError(TimeoutError):
    pass


class JobManager:
    def __init__(
        self,
        max_concurrent: int,
        timeout_seconds: float,
        history_limit: int = 100,
        *,
        store: JobStore | None = None,
        claim_ttl_seconds: float = 120.0,
        result_ttl_seconds: float = 1800.0,
        history_ttl_seconds: float = 86400.0,
        poll_interval_seconds: float = 0.1,
    ) -> None:
        self._semaphore = asyncio.Semaphore(max(1, max_concurrent))
        self._timeout_seconds = max(0.01, timeout_seconds)
        self._claim_ttl_seconds = max(
            claim_ttl_seconds,
            self._timeout_seconds + 5.0,
        )
        self._result_ttl_seconds = max(0.01, result_ttl_seconds)
        self._history_ttl_seconds = max(
            self._result_ttl_seconds,
            history_ttl_seconds,
        )
        self._poll_interval_seconds = max(0.01, poll_interval_seconds)
        self._store = store or MemoryJobStore(history_limit)
        self._owner_id = str(uuid4())
        self._tasks: dict[str, asyncio.Task[object]] = {}
        self._request_keys: dict[str, str] = {}
        self._coordination_lock = asyncio.Lock()
        self._initialize_lock = asyncio.Lock()
        self._initialized = False

    async def initialize(self) -> JobCleanupStats:
        await self._ensure_initialized()
        return await self._store.cleanup_expired()

    async def run(
        self,
        job_id: str,
        factory: JobFactory[T],
        request_key: str = "",
    ) -> T:
        await self._ensure_initialized()
        initial_snapshot = self._snapshot(
            job_id=job_id,
            status="queued",
            phase="queued",
            progress=0,
            message="음성 생성 대기열에 등록했습니다.",
        )

        task = await self._join_or_start(
            job_id,
            request_key,
            factory,
            initial_snapshot,
        )
        if task is not None:
            return cast(T, await asyncio.shield(task))

        return await self._wait_for_remote_or_claim(
            job_id,
            request_key,
            factory,
            initial_snapshot,
        )

    async def _join_or_start(
        self,
        job_id: str,
        request_key: str,
        factory: JobFactory[T],
        initial_snapshot: JobProgressResponse,
    ) -> asyncio.Task[object] | None:
        async with self._coordination_lock:
            existing_key = self._request_keys.get(job_id)
            if existing_key is not None and existing_key != request_key:
                raise JobConflictError(job_id)

            existing_task = self._tasks.get(job_id)
            if existing_task is not None:
                return existing_task

            claim = await self._store.claim(
                job_id=job_id,
                request_key=request_key,
                owner_id=self._owner_id,
                lease_seconds=self._claim_ttl_seconds,
                initial_snapshot=initial_snapshot,
            )
            if claim.state == "conflict":
                raise JobConflictError(job_id)
            if claim.state == "expired":
                raise JobResultExpiredError(job_id)
            if claim.state == "completed":
                completed = asyncio.get_running_loop().create_future()
                completed.set_result(claim.result)
                return cast(asyncio.Task[object], completed)
            if claim.state == "busy":
                return None

            self._request_keys[job_id] = request_key
            task = asyncio.create_task(self._execute(job_id, factory))
            self._tasks[job_id] = task
            return task

    async def _wait_for_remote_or_claim(
        self,
        job_id: str,
        request_key: str,
        factory: JobFactory[T],
        initial_snapshot: JobProgressResponse,
    ) -> T:
        loop = asyncio.get_running_loop()
        deadline = loop.time() + self._claim_ttl_seconds + self._timeout_seconds
        while loop.time() < deadline:
            await asyncio.sleep(self._poll_interval_seconds)
            snapshot = await self._store.get_snapshot(job_id)
            if snapshot is not None:
                if snapshot.phase == "completed":
                    result = await self._store.get_result(job_id)
                    if result is None:
                        raise JobResultExpiredError(job_id)
                    return cast(T, result)
                if snapshot.phase == "failed":
                    raise RuntimeError(snapshot.error or snapshot.message)
                if snapshot.phase == "cancelled":
                    raise asyncio.CancelledError(job_id)

            task = await self._join_or_start(
                job_id,
                request_key,
                factory,
                initial_snapshot,
            )
            if task is not None:
                return cast(T, await asyncio.shield(task))

        raise GenerationTimeoutError(job_id)

    async def _execute(self, job_id: str, factory: JobFactory[T]) -> T:
        current_task = asyncio.current_task()
        cancel_watcher = asyncio.create_task(
            self._watch_cancel_request(job_id, current_task)
        )
        try:
            result = await asyncio.wait_for(
                self._run_limited(job_id, factory),
                timeout=self._timeout_seconds,
            )
            completed = await self._terminal_snapshot(
                job_id,
                status="completed",
                phase="completed",
                progress=100,
                message="음성 생성이 완료되었습니다.",
            )
            saved = await self._store.complete(
                job_id=job_id,
                owner_id=self._owner_id,
                snapshot=completed,
                result=result,
                result_ttl_seconds=self._result_ttl_seconds,
                history_ttl_seconds=self._history_ttl_seconds,
            )
            if not saved:
                snapshot = await self._store.get_snapshot(job_id)
                if snapshot is not None and snapshot.phase == "cancelled":
                    raise asyncio.CancelledError(job_id)
                raise JobLeaseLostError(job_id)
            return result
        except asyncio.TimeoutError as error:
            failed = await self._terminal_snapshot(
                job_id,
                status="failed",
                phase="failed",
                message="음성 생성 시간이 초과되었습니다.",
                error="generation-timeout",
            )
            await self._finish(job_id, failed)
            raise GenerationTimeoutError(job_id) from error
        except asyncio.CancelledError:
            cancelled = await self._terminal_snapshot(
                job_id,
                status="cancelled",
                phase="cancelled",
                message="사용자가 음성 생성을 취소했습니다.",
            )
            await self._finish(job_id, cancelled)
            raise
        except Exception as error:
            failed = await self._terminal_snapshot(
                job_id,
                status="failed",
                phase="failed",
                message="음성 생성에 실패했습니다.",
                error=str(error) or error.__class__.__name__,
            )
            await self._finish(job_id, failed)
            raise
        finally:
            cancel_watcher.cancel()
            await asyncio.gather(cancel_watcher, return_exceptions=True)
            async with self._coordination_lock:
                if self._tasks.get(job_id) is current_task:
                    self._tasks.pop(job_id, None)
                    self._request_keys.pop(job_id, None)

    async def _run_limited(self, job_id: str, factory: JobFactory[T]) -> T:
        async with self._semaphore:
            await self.update(
                job_id,
                status="processing",
                phase="normalizing",
                progress=3,
                message="한국어 문장을 준비하고 있습니다.",
            )
            return await factory()

    async def _watch_cancel_request(
        self,
        job_id: str,
        task: asyncio.Task[object] | None,
    ) -> None:
        if task is None:
            return
        while not task.done():
            await asyncio.sleep(self._poll_interval_seconds)
            if await self._store.is_cancel_requested(job_id, self._owner_id):
                task.cancel()
                return

    async def update(
        self,
        job_id: str,
        *,
        status: JobStatus | None = None,
        phase: JobPhase | None = None,
        progress: int | None = None,
        current_segment: int | None = None,
        total_segments: int | None = None,
        message: str | None = None,
        error: str | None = None,
    ) -> JobProgressResponse:
        await self._ensure_initialized()
        current = await self._store.get_snapshot(job_id) or self._snapshot(
            job_id=job_id,
            status="processing",
            phase="generating",
            progress=0,
            message="음성 생성 상태를 준비했습니다.",
        )
        next_progress = progress if progress is not None else current.progress
        next_current_segment = (
            current_segment
            if current_segment is not None
            else current.current_segment
        )
        next_total_segments = (
            total_segments
            if total_segments is not None
            else current.total_segments
        )
        updated = current.model_copy(
            update={
                "status": status or current.status,
                "phase": phase or current.phase,
                "progress": max(0, min(100, next_progress)),
                "current_segment": next_current_segment,
                "total_segments": next_total_segments,
                "message": message or current.message,
                "error": error,
                "updated_at": self._now(),
            }
        )
        saved = await self._store.update_snapshot(
            job_id,
            self._owner_id,
            updated,
        )
        if saved:
            return updated
        return await self._store.get_snapshot(job_id) or updated

    async def get(self, job_id: str) -> JobProgressResponse | None:
        await self._ensure_initialized()
        return await self._store.get_snapshot(job_id)

    async def get_result(self, job_id: str) -> object | None:
        await self._ensure_initialized()
        return await self._store.get_result(job_id)

    async def cancel(self, job_id: str) -> bool:
        await self._ensure_initialized()
        requested = await self._store.request_cancel(
            job_id,
            self._history_ttl_seconds,
        )
        if not requested:
            return False
        async with self._coordination_lock:
            task = self._tasks.get(job_id)
            if task is not None and not task.done():
                task.cancel()
        return True

    async def cleanup_expired(self) -> JobCleanupStats:
        await self._ensure_initialized()
        return await self._store.cleanup_expired()

    async def _finish(
        self,
        job_id: str,
        snapshot: JobProgressResponse,
    ) -> None:
        await self._store.finish(
            job_id=job_id,
            owner_id=self._owner_id,
            snapshot=snapshot,
            history_ttl_seconds=self._history_ttl_seconds,
        )

    async def _terminal_snapshot(
        self,
        job_id: str,
        *,
        status: JobStatus,
        phase: JobPhase,
        message: str,
        progress: int | None = None,
        error: str | None = None,
    ) -> JobProgressResponse:
        current = await self._store.get_snapshot(job_id) or self._snapshot(
            job_id=job_id,
            status=status,
            phase=phase,
            progress=progress or 0,
            message=message,
        )
        return current.model_copy(
            update={
                "status": status,
                "phase": phase,
                "progress": current.progress if progress is None else progress,
                "message": message,
                "error": error,
                "updated_at": self._now(),
            }
        )

    async def _ensure_initialized(self) -> None:
        if self._initialized:
            return
        async with self._initialize_lock:
            if self._initialized:
                return
            await self._store.initialize()
            self._initialized = True

    @classmethod
    def _snapshot(
        cls,
        *,
        job_id: str,
        status: JobStatus,
        phase: JobPhase,
        progress: int,
        message: str,
    ) -> JobProgressResponse:
        return JobProgressResponse(
            job_id=job_id,
            status=status,
            phase=phase,
            progress=progress,
            message=message,
            updated_at=cls._now(),
        )

    @staticmethod
    def _now() -> str:
        return datetime.now(timezone.utc).isoformat()
