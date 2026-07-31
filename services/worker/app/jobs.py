import asyncio
import re
import time
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from uuid import UUID, uuid4

from app.runtime import CosyVoiceRuntime
from app.wav_tools import merge_wav_files

TERMINAL_STATUSES = {"completed", "failed", "cancelled"}


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def split_text(text: str) -> list[str]:
    normalized = re.sub(r"\s+", " ", text).strip()
    if not normalized:
        return []
    parts = re.split(r"(?<=[.!?。！？])\s+|(?<=[다요죠네까])\.\s*", normalized)
    segments = [part.strip() for part in parts if part.strip()]
    return segments or [normalized]


@dataclass
class SegmentRecord:
    index: int
    text: str
    output_path: Path
    status: str = "queued"
    progress: int = 0
    message: str = "대기 중"
    error: str | None = None

    def snapshot(self, job_id: UUID) -> dict[str, object]:
        audio_url = None
        if self.status == "completed" and self.output_path.exists():
            audio_url = f"/v1/jobs/{job_id}/segments/{self.index}/audio"
        return {
            "index": self.index,
            "text": self.text,
            "status": self.status,
            "progress": self.progress,
            "message": self.message,
            "error": self.error,
            "audio_url": audio_url,
        }


@dataclass
class JobRecord:
    id: UUID
    profile_id: str
    text: str
    sample_path: Path
    output_path: Path
    segments: list[SegmentRecord]
    status: str = "queued"
    progress: int = 0
    phase: str = "queued"
    message: str = "Worker 대기열에 등록했습니다."
    created_at: str = field(default_factory=utc_now)
    updated_at: str = field(default_factory=utc_now)
    first_audio_ms: int | None = None
    duration_seconds: float | None = None
    error: str | None = None
    revision: int = 0
    started_at: float | None = None
    cancel_event: asyncio.Event = field(default_factory=asyncio.Event)
    task: asyncio.Task[None] | None = None

    def touch(self) -> None:
        self.updated_at = utc_now()
        self.revision += 1

    def snapshot(self) -> dict[str, object]:
        audio_url = None
        if self.status == "completed" and self.output_path.exists():
            audio_url = f"/v1/jobs/{self.id}/audio"
        return {
            "id": str(self.id),
            "profile_id": self.profile_id,
            "status": self.status,
            "progress": self.progress,
            "phase": self.phase,
            "message": self.message,
            "text": self.text,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
            "first_audio_ms": self.first_audio_ms,
            "duration_seconds": self.duration_seconds,
            "audio_url": audio_url,
            "events_url": f"/v1/jobs/{self.id}/events",
            "error": self.error,
            "segments": [segment.snapshot(self.id) for segment in self.segments],
        }


class WorkerJobManager:
    def __init__(
        self,
        runtime: CosyVoiceRuntime,
        output_root: Path,
        max_concurrent: int,
    ) -> None:
        self.runtime = runtime
        self.output_root = output_root
        self.output_root.mkdir(parents=True, exist_ok=True)
        self._jobs: dict[UUID, JobRecord] = {}
        self._semaphore = asyncio.Semaphore(max_concurrent)

    def create(self, profile_id: str, text: str, sample_path: Path) -> JobRecord:
        job_id = uuid4()
        job_root = self.output_root / str(job_id)
        job_root.mkdir(parents=True, exist_ok=True)
        segments = [
            SegmentRecord(index=index, text=value, output_path=job_root / f"segment-{index}.wav")
            for index, value in enumerate(split_text(text), start=1)
        ]
        job = JobRecord(
            id=job_id,
            profile_id=profile_id,
            text=text,
            sample_path=sample_path,
            output_path=job_root / "result.wav",
            segments=segments,
        )
        self._jobs[job_id] = job
        job.task = asyncio.create_task(self._run(job))
        return job

    def get(self, job_id: UUID) -> JobRecord | None:
        return self._jobs.get(job_id)

    async def cancel(self, job_id: UUID) -> JobRecord | None:
        job = self.get(job_id)
        if job is None:
            return None
        if job.status in TERMINAL_STATUSES:
            return job
        job.cancel_event.set()
        if job.task:
            await asyncio.gather(job.task, return_exceptions=True)
        return job

    def retry(self, job_id: UUID) -> JobRecord | None:
        job = self.get(job_id)
        if job is None or job.status not in {"failed", "cancelled"}:
            return job
        job.cancel_event = asyncio.Event()
        job.error = None
        job.status = "queued"
        job.phase = "retrying"
        job.message = "실패하거나 취소된 구간만 다시 시도합니다."
        for segment in job.segments:
            if segment.status != "completed":
                segment.status = "queued"
                segment.progress = 0
                segment.message = "재시도 대기 중"
                segment.error = None
        job.touch()
        job.task = asyncio.create_task(self._run(job))
        return job

    async def _run(self, job: JobRecord) -> None:
        async with self._semaphore:
            job.started_at = time.perf_counter()
            job.status = "running"
            job.phase = "synthesizing"
            job.message = "CosyVoice가 문장별 음성을 생성하고 있습니다."
            job.touch()
            try:
                for segment in job.segments:
                    if segment.status == "completed":
                        continue
                    if job.cancel_event.is_set():
                        raise asyncio.CancelledError
                    await self._run_segment(job, segment)
                completed = [segment.output_path for segment in job.segments]
                job.duration_seconds = merge_wav_files(completed, job.output_path)
                job.status = "completed"
                job.phase = "completed"
                job.progress = 100
                job.message = "복제 음성을 완성했습니다."
                job.touch()
            except asyncio.CancelledError:
                job.status = "cancelled"
                job.phase = "cancelled"
                job.message = "복제 작업을 취소했습니다."
                for segment in job.segments:
                    if segment.status in {"queued", "running"}:
                        segment.status = "cancelled"
                        segment.message = "취소됨"
                job.touch()
            except Exception as error:
                job.status = "failed"
                job.phase = "failed"
                job.message = "복제 작업을 완료하지 못했습니다."
                job.error = str(error)
                job.touch()

    async def _run_segment(self, job: JobRecord, segment: SegmentRecord) -> None:
        segment.status = "running"
        segment.message = "음성 생성 중"
        job.touch()

        async def on_progress(progress: int, message: str) -> None:
            segment.progress = max(0, min(100, progress))
            segment.message = message
            completed = sum(1 for item in job.segments if item.status == "completed")
            job.progress = round(
                ((completed + segment.progress / 100) / max(1, len(job.segments))) * 100
            )
            job.message = f"{segment.index}/{len(job.segments)} 구간 · {message}"
            job.touch()

        try:
            await self.runtime.generate(
                job.sample_path,
                segment.text,
                segment.output_path,
                on_progress,
                job.cancel_event,
            )
        except asyncio.CancelledError:
            segment.status = "cancelled"
            segment.message = "취소됨"
            raise
        except Exception as error:
            segment.status = "failed"
            segment.message = "생성 실패"
            segment.error = str(error)
            raise
        segment.status = "completed"
        segment.progress = 100
        segment.message = "완료"
        if job.first_audio_ms is None and job.started_at is not None:
            job.first_audio_ms = round((time.perf_counter() - job.started_at) * 1000)
        completed = sum(1 for item in job.segments if item.status == "completed")
        job.progress = round(completed / max(1, len(job.segments)) * 100)
        job.touch()
