import json
import wave
from datetime import datetime, timedelta, timezone
from pathlib import Path
from uuid import UUID

from fastapi import UploadFile

ALLOWED_EXTENSIONS = {".wav", ".mp3", ".m4a", ".webm", ".ogg"}


class VoiceCloneStore:
    def __init__(self, root: Path, ttl_days: int, max_file_bytes: int) -> None:
        self.root = root
        self.ttl = timedelta(days=max(1, ttl_days))
        self.max_file_bytes = max_file_bytes
        self.root.mkdir(parents=True, exist_ok=True)

    async def save_sample(self, profile_id: UUID, sample: UploadFile) -> Path:
        extension = Path(sample.filename or "").suffix.lower()
        if extension not in ALLOWED_EXTENSIONS:
            raise ValueError("SOA-5002: WAV, MP3, M4A, WEBM, OGG 음성만 사용할 수 있습니다.")
        destination = self.root / f"{profile_id}{extension}"
        total = 0
        try:
            with destination.open("wb") as output:
                while chunk := await sample.read(1024 * 1024):
                    total += len(chunk)
                    if total > self.max_file_bytes:
                        raise ValueError("SOA-5003: 음성 샘플은 25MB 이하만 사용할 수 있습니다.")
                    output.write(chunk)
        except Exception:
            destination.unlink(missing_ok=True)
            raise
        if total == 0:
            destination.unlink(missing_ok=True)
            raise ValueError("SOA-5004: 비어 있는 음성 파일은 사용할 수 없습니다.")
        return destination

    def inspect_sample(self, path: Path) -> dict[str, float | int | None]:
        if path.suffix.lower() != ".wav":
            return {
                "duration_seconds": None,
                "sample_rate": None,
                "channel_count": None,
            }
        try:
            with wave.open(str(path), "rb") as reader:
                frame_rate = reader.getframerate()
                frame_count = reader.getnframes()
                return {
                    "duration_seconds": frame_count / frame_rate if frame_rate else 0,
                    "sample_rate": frame_rate,
                    "channel_count": reader.getnchannels(),
                }
        except (wave.Error, EOFError) as error:
            raise ValueError("SOA-5008: 손상되었거나 지원하지 않는 WAV 파일입니다.") from error

    def save_metadata(self, profile_id: UUID, payload: dict[str, object]) -> None:
        path = self.root / f"{profile_id}.json"
        path.write_text(
            json.dumps(payload, ensure_ascii=False, indent=2),
            encoding="utf-8",
        )


    def load_metadata(self, profile_id: UUID) -> dict[str, object] | None:
        path = self.root / f"{profile_id}.json"
        if not path.exists():
            return None
        try:
            payload = json.loads(path.read_text(encoding="utf-8"))
        except (json.JSONDecodeError, OSError):
            return None
        return payload if isinstance(payload, dict) else None

    def sample_path(self, profile_id: UUID) -> Path | None:
        metadata = self.load_metadata(profile_id)
        sample_file = metadata.get("sample_file") if metadata else None
        if not isinstance(sample_file, str):
            return None
        path = self.root / sample_file
        return path if path.exists() else None

    def delete_profile(self, profile_id: UUID) -> bool:
        deleted = False
        for path in self.root.glob(f"{profile_id}.*"):
            path.unlink(missing_ok=True)
            deleted = True
        return deleted

    def cleanup_expired(self, now: datetime | None = None) -> int:
        current = now or datetime.now(timezone.utc)
        removed = 0
        expired_ids: set[str] = set()
        for path in self.root.glob("*.*"):
            modified = datetime.fromtimestamp(path.stat().st_mtime, tz=timezone.utc)
            if current - modified > self.ttl:
                expired_ids.add(path.stem)
        for profile_id in expired_ids:
            for path in self.root.glob(f"{profile_id}.*"):
                path.unlink(missing_ok=True)
                removed += 1
        return removed
