import asyncio
from collections.abc import Awaitable, Callable
from typing import TypeVar

T = TypeVar("T")


class JobAlreadyRunningError(RuntimeError):
    pass


class GenerationTimeoutError(TimeoutError):
    pass


class JobManager:
    def __init__(self, max_concurrent: int, timeout_seconds: float) -> None:
        self._semaphore = asyncio.Semaphore(max(1, max_concurrent))
        self._timeout_seconds = timeout_seconds
        self._tasks: dict[str, asyncio.Task[object]] = {}
        self._lock = asyncio.Lock()

    async def run(self, job_id: str, factory: Callable[[], Awaitable[T]]) -> T:
        async with self._lock:
            if job_id in self._tasks:
                raise JobAlreadyRunningError(job_id)
            task = asyncio.create_task(self._run_limited(factory))
            self._tasks[job_id] = task

        try:
            return await asyncio.wait_for(task, timeout=self._timeout_seconds)
        except TimeoutError as error:
            task.cancel()
            raise GenerationTimeoutError(job_id) from error
        finally:
            async with self._lock:
                self._tasks.pop(job_id, None)

    async def _run_limited(self, factory: Callable[[], Awaitable[T]]) -> T:
        async with self._semaphore:
            return await factory()

    async def cancel(self, job_id: str) -> bool:
        async with self._lock:
            task = self._tasks.get(job_id)
            if task is None or task.done():
                return False
            task.cancel()
            return True
