from datetime import datetime, timedelta, timezone
from pathlib import Path
from uuid import UUID


class AudioStore:
    def __init__(self, root: Path, ttl_minutes: int) -> None:
        self.root = root
        self.ttl = timedelta(minutes=ttl_minutes)
        self.root.mkdir(parents=True, exist_ok=True)

    def output_path(self, job_id: UUID, extension: str = "wav") -> Path:
        safe_extension = extension.lower().lstrip(".")
        if safe_extension not in {"wav", "mp3", "flac"}:
            raise ValueError("지원하지 않는 음원 확장자입니다.")
        return self.root / f"{job_id}.{safe_extension}"

    def resolve(self, filename: str) -> Path | None:
        if Path(filename).name != filename:
            return None
        candidate = (self.root / filename).resolve()
        if candidate.parent != self.root or not candidate.is_file():
            return None
        return candidate

    def remove(self, path: Path) -> None:
        path.unlink(missing_ok=True)

    def cleanup_expired(self, now: datetime | None = None) -> int:
        current = now or datetime.now(timezone.utc)
        removed = 0
        for path in self.root.glob("*.*"):
            modified = datetime.fromtimestamp(path.stat().st_mtime, tz=timezone.utc)
            if current - modified > self.ttl:
                path.unlink(missing_ok=True)
                removed += 1
        return removed
