import asyncio
from collections.abc import Awaitable, Callable
from datetime import datetime, timezone
from typing import TypeVar

from app.schemas.tts import JobPhase, JobProgressResponse, JobStatus

T = TypeVar("T")
JobFactory = Callable[[], Awaitable[T]]


class JobAlreadyRunningError(RuntimeError):
    pass


class GenerationTimeoutError(TimeoutError):
    pass


class JobManager:
    def __init__(self, max_concurrent: int, timeout_seconds: float, history_limit: int = 100) -> None:
        self._semaphore = asyncio.Semaphore(max(1, max_concurrent))
        self._timeout_seconds = timeout_seconds
        self._history_limit = max(10, history_limit)
        self._tasks: dict[str, asyncio.Task[object]] = {}
        self._snapshots: dict[str, JobProgressResponse] = {}
        self._lock = asyncio.Lock()

    async def run(self, job_id: str, factory: JobFactory[T]) -> T:
        async with self._lock:
            if job_id in self._tasks:
                raise JobAlreadyRunningError(job_id)
            self._snapshots[job_id] = self._snapshot(
                job_id=job_id,
                status="queued",
                phase="queued",
                progress=0,
                message="음성 생성 대기열에 등록했습니다.",
            )
            self._trim_history()
            task = asyncio.create_task(self._run_limited(job_id, factory))
            self._tasks[job_id] = task

        try:
            result = await asyncio.wait_for(task, timeout=self._timeout_seconds)
            await self.update(
                job_id,
                status="completed",
                phase="completed",
                progress=100,
                message="음성 생성이 완료되었습니다.",
            )
            return result
        except TimeoutError as error:
            task.cancel()
            await self.update(
                job_id,
                status="failed",
                phase="failed",
                message="음성 생성 시간이 초과되었습니다.",
                error="generation-timeout",
            )
            raise GenerationTimeoutError(job_id) from error
        except asyncio.CancelledError:
            await self.update(
                job_id,
                status="cancelled",
                phase="cancelled",
                message="사용자가 음성 생성을 취소했습니다.",
            )
            raise
        except Exception as error:
            await self.update(
                job_id,
                status="failed",
                phase="failed",
                message="음성 생성에 실패했습니다.",
                error=str(error) or error.__class__.__name__,
            )
            raise
        finally:
            async with self._lock:
                self._tasks.pop(job_id, None)

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
        async with self._lock:
            current = self._snapshots.get(job_id) or self._snapshot(
                job_id=job_id,
                status="processing",
                phase="generating",
                progress=0,
                message="음성 생성 상태를 준비했습니다.",
            )
            updated = current.model_copy(update={
                "status": status or current.status,
                "phase": phase or current.phase,
                "progress": max(0, min(100, progress if progress is not None else current.progress)),
                "current_segment": current_segment if current_segment is not None else current.current_segment,
                "total_segments": total_segments if total_segments is not None else current.total_segments,
                "message": message or current.message,
                "error": error,
                "updated_at": self._now(),
            })
            self._snapshots[job_id] = updated
            self._trim_history()
            return updated

    async def get(self, job_id: str) -> JobProgressResponse | None:
        async with self._lock:
            return self._snapshots.get(job_id)

    async def cancel(self, job_id: str) -> bool:
        async with self._lock:
            task = self._tasks.get(job_id)
            if task is None or task.done():
                return False
            task.cancel()
        await self.update(
            job_id,
            status="cancelled",
            phase="cancelled",
            message="생성 취소를 요청했습니다.",
        )
        return True

    def _trim_history(self) -> None:
        overflow = len(self._snapshots) - self._history_limit
        if overflow <= 0:
            return
        active = set(self._tasks)
        removable = [key for key in self._snapshots if key not in active]
        for key in removable[:overflow]:
            self._snapshots.pop(key, None)

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
