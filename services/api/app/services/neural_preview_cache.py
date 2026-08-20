import hashlib
import json
import shutil
from dataclasses import asdict, dataclass
from datetime import datetime, timedelta, timezone
from pathlib import Path


@dataclass(frozen=True)
class NeuralPreviewCacheEntry:
    cache_id: str
    voice_id: str
    preview_cache_key: str
    text_sha256: str
    style_sha256: str
    audio_sha256: str
    engine_id: str
    model_fingerprint: str
    reference_fingerprint: str
    first_audio_ms: int | None
    processing_ms: int | None
    duration_seconds: float
    file_size_bytes: int
    created_at: str


class NeuralPreviewCache:
    schema = "neural-preview-cache/1"

    def __init__(self, root: Path, ttl_minutes: int = 7 * 24 * 60) -> None:
        self.root = root
        self.ttl = timedelta(minutes=max(1, ttl_minutes))
        self.root.mkdir(parents=True, exist_ok=True)

    @staticmethod
    def text_digest(text: str) -> str:
        return hashlib.sha256(text.encode()).hexdigest()

    @staticmethod
    def style_digest(*, emotion: str, speed: float, pitch: int) -> str:
        payload = json.dumps(
            {"emotion": emotion, "speed": round(speed, 4), "pitch": pitch},
            ensure_ascii=False,
            separators=(",", ":"),
            sort_keys=True,
        )
        return hashlib.sha256(payload.encode("utf-8")).hexdigest()

    @staticmethod
    def cache_id(preview_cache_key: str, text_sha256: str, style_sha256: str) -> str:
        return hashlib.sha256(
            f"{preview_cache_key}:{text_sha256}:{style_sha256}".encode("utf-8")
        ).hexdigest()

    @staticmethod
    def sha256_file(path: Path) -> str:
        digest = hashlib.sha256()
        with path.open("rb") as source:
            for chunk in iter(lambda: source.read(1024 * 1024), b""):
                digest.update(chunk)
        return digest.hexdigest()

    def audio_path(self, cache_id: str) -> Path:
        self._validate_cache_id(cache_id)
        return self.root / f"{cache_id}.wav"

    def metadata_path(self, cache_id: str) -> Path:
        self._validate_cache_id(cache_id)
        return self.root / f"{cache_id}.json"

    def resolve_audio(self, cache_id: str) -> Path | None:
        try:
            path = self.audio_path(cache_id)
        except ValueError:
            return None
        return path if path.is_file() else None

    def get(self, cache_id: str) -> NeuralPreviewCacheEntry | None:
        try:
            audio_path = self.audio_path(cache_id)
            metadata_path = self.metadata_path(cache_id)
        except ValueError:
            return None
        if not audio_path.is_file() or not metadata_path.is_file():
            return None
        try:
            payload = json.loads(metadata_path.read_text(encoding="utf-8"))
            if payload.get("schema") != self.schema:
                return None
            entry = NeuralPreviewCacheEntry(**payload["entry"])
        except (OSError, ValueError, TypeError, KeyError, json.JSONDecodeError):
            return None
        if entry.cache_id != cache_id or self.sha256_file(audio_path) != entry.audio_sha256:
            return None
        return entry

    def put(
        self,
        *,
        cache_id: str,
        source_audio: Path,
        voice_id: str,
        preview_cache_key: str,
        text_sha256: str,
        style_sha256: str,
        engine_id: str,
        model_fingerprint: str,
        reference_fingerprint: str,
        first_audio_ms: int | None,
        processing_ms: int | None,
        duration_seconds: float,
    ) -> NeuralPreviewCacheEntry:
        audio_path = self.audio_path(cache_id)
        metadata_path = self.metadata_path(cache_id)
        temporary_audio = audio_path.with_suffix(".wav.tmp")
        temporary_metadata = metadata_path.with_suffix(".json.tmp")
        shutil.copyfile(source_audio, temporary_audio)
        audio_sha256 = self.sha256_file(temporary_audio)
        entry = NeuralPreviewCacheEntry(
            cache_id=cache_id,
            voice_id=voice_id,
            preview_cache_key=preview_cache_key,
            text_sha256=text_sha256,
            style_sha256=style_sha256,
            audio_sha256=audio_sha256,
            engine_id=engine_id,
            model_fingerprint=model_fingerprint,
            reference_fingerprint=reference_fingerprint,
            first_audio_ms=first_audio_ms,
            processing_ms=processing_ms,
            duration_seconds=duration_seconds,
            file_size_bytes=temporary_audio.stat().st_size,
            created_at=datetime.now(timezone.utc).isoformat(),
        )
        temporary_metadata.write_text(
            json.dumps(
                {"schema": self.schema, "entry": asdict(entry)},
                ensure_ascii=False,
                indent=2,
            ) + "\n",
            encoding="utf-8",
        )
        temporary_audio.replace(audio_path)
        temporary_metadata.replace(metadata_path)
        return entry

    def cleanup_expired(self, now: datetime | None = None) -> int:
        current = now or datetime.now(timezone.utc)
        removed = 0
        for metadata_path in self.root.glob("*.json"):
            modified = datetime.fromtimestamp(metadata_path.stat().st_mtime, tz=timezone.utc)
            if current - modified <= self.ttl:
                continue
            cache_id = metadata_path.stem
            metadata_path.unlink(missing_ok=True)
            try:
                self.audio_path(cache_id).unlink(missing_ok=True)
            except ValueError:
                pass
            removed += 1
        return removed

    @staticmethod
    def _validate_cache_id(cache_id: str) -> None:
        if len(cache_id) != 64 or any(char not in "0123456789abcdef" for char in cache_id):
            raise ValueError("neural preview cache id가 SHA-256 형식이 아닙니다.")
