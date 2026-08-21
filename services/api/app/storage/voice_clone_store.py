import json
import math
import shutil
import subprocess
import sys
import wave
from array import array
from datetime import datetime, timedelta, timezone
from pathlib import Path
from uuid import UUID

from fastapi import UploadFile

ALLOWED_EXTENSIONS = {".wav", ".mp3", ".m4a", ".webm", ".ogg"}
_SILENCE_THRESHOLD = 0.015
_CLIPPING_THRESHOLD = 0.98
_ANALYSIS_SAMPLE_RATE = 16_000
_MAX_PROMPT_SECONDS = 30.0


class VoiceCloneStore:
    def __init__(self, root: Path, ttl_days: int, max_file_bytes: int) -> None:
        self.root = root
        self.ttl = timedelta(days=max(1, ttl_days))
        self.max_file_bytes = max_file_bytes
        self.root.mkdir(parents=True, exist_ok=True)

    def accepted_extensions(self) -> set[str]:
        if shutil.which("ffmpeg"):
            return set(ALLOWED_EXTENSIONS)
        return {".wav"}

    async def save_sample(self, profile_id: UUID, sample: UploadFile) -> Path:
        extension = Path(sample.filename or "").suffix.lower()
        if extension not in ALLOWED_EXTENSIONS:
            raise ValueError("SOA-5002: WAV, MP3, M4A, WEBM, OGG 음성만 사용할 수 있습니다.")
        if extension != ".wav" and not shutil.which("ffmpeg"):
            raise ValueError(
                "SOA-5010: 이 서버는 비-WAV 샘플을 검증할 FFmpeg가 없어 WAV만 사용할 수 있습니다."
            )
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

    def normalize_for_engine(self, profile_id: UUID, path: Path) -> Path:
        """Convert a validated reference to the engine's canonical 16 kHz mono WAV."""
        ffmpeg = shutil.which("ffmpeg")
        if not ffmpeg:
            if path.suffix.lower() != ".wav":
                raise ValueError(
                    "SOA-5010: 비-WAV 샘플을 엔진용 WAV로 변환할 FFmpeg가 없습니다."
                )
            analysis = self._inspect_wave(path)
            if analysis.get("sample_rate") != _ANALYSIS_SAMPLE_RATE:
                raise ValueError(
                    "SOA-5016: FFmpeg가 없는 서버에서는 16kHz mono WAV만 사용할 수 있습니다."
                )
            if analysis.get("channel_count") != 1:
                raise ValueError(
                    "SOA-5016: FFmpeg가 없는 서버에서는 16kHz mono WAV만 사용할 수 있습니다."
                )
            return path

        destination = self.root / f"{profile_id}.wav"
        temporary = self.root / f"{profile_id}.engine.tmp.wav"
        command = [
            ffmpeg,
            "-nostdin",
            "-v",
            "error",
            "-y",
            "-i",
            str(path),
            "-vn",
            "-ac",
            "1",
            "-ar",
            str(_ANALYSIS_SAMPLE_RATE),
            "-c:a",
            "pcm_s16le",
            "-t",
            str(_MAX_PROMPT_SECONDS),
            str(temporary),
        ]
        try:
            process = subprocess.run(
                command,
                capture_output=True,
                check=False,
                timeout=45,
            )
        except (OSError, subprocess.TimeoutExpired) as error:
            temporary.unlink(missing_ok=True)
            raise ValueError(
                "SOA-5016: 음성 샘플을 엔진용 WAV로 정규화하지 못했습니다."
            ) from error
        if process.returncode != 0 or not temporary.exists():
            temporary.unlink(missing_ok=True)
            raise ValueError(
                "SOA-5016: 음성 샘플을 엔진용 WAV로 정규화하지 못했습니다."
            )
        temporary.replace(destination)
        if path != destination:
            path.unlink(missing_ok=True)
        return destination

    def inspect_sample(self, path: Path) -> dict[str, object]:
        ffmpeg = shutil.which("ffmpeg")
        if ffmpeg:
            return self._inspect_with_ffmpeg(path, ffmpeg)
        if path.suffix.lower() == ".wav":
            return self._inspect_wave(path)
        raise ValueError(
            "SOA-5010: 이 서버는 비-WAV 샘플을 검증할 FFmpeg가 없어 WAV만 사용할 수 있습니다."
        )

    def _inspect_with_ffmpeg(self, path: Path, ffmpeg: str) -> dict[str, object]:
        metadata = self._ffprobe_metadata(path)
        command = [
            ffmpeg,
            "-nostdin",
            "-v",
            "error",
            "-i",
            str(path),
            "-vn",
            "-ac",
            "1",
            "-ar",
            str(_ANALYSIS_SAMPLE_RATE),
            "-t",
            str(_MAX_PROMPT_SECONDS + 1),
            "-f",
            "f32le",
            "pipe:1",
        ]
        try:
            process = subprocess.run(
                command,
                capture_output=True,
                check=False,
                timeout=45,
            )
        except (OSError, subprocess.TimeoutExpired) as error:
            raise ValueError("SOA-5008: 음성 샘플을 안전하게 디코딩하지 못했습니다.") from error
        if process.returncode != 0 or not process.stdout:
            detail = process.stderr.decode("utf-8", errors="replace").strip()
            suffix = f" ({detail[:180]})" if detail else ""
            raise ValueError(f"SOA-5008: 손상되었거나 지원하지 않는 음성 파일입니다.{suffix}")

        samples = array("f")
        samples.frombytes(process.stdout[: len(process.stdout) - (len(process.stdout) % 4)])
        if sys.byteorder != "little":
            samples.byteswap()
        duration = metadata.get("duration_seconds")
        if not isinstance(duration, (int, float)) or duration <= 0:
            duration = len(samples) / _ANALYSIS_SAMPLE_RATE
        return self._summarize(
            samples,
            float(duration),
            metadata.get("sample_rate"),
            metadata.get("channel_count"),
        )

    def _ffprobe_metadata(self, path: Path) -> dict[str, float | int | None]:
        ffprobe = shutil.which("ffprobe")
        if not ffprobe:
            return {"duration_seconds": None, "sample_rate": None, "channel_count": None}
        try:
            process = subprocess.run(
                [
                    ffprobe,
                    "-v",
                    "error",
                    "-select_streams",
                    "a:0",
                    "-show_entries",
                    "stream=sample_rate,channels:format=duration",
                    "-of",
                    "json",
                    str(path),
                ],
                capture_output=True,
                text=True,
                check=False,
                timeout=12,
            )
            payload = json.loads(process.stdout) if process.returncode == 0 else {}
            streams = payload.get("streams") if isinstance(payload, dict) else None
            stream = streams[0] if isinstance(streams, list) and streams else {}
            format_info = payload.get("format") if isinstance(payload, dict) else {}
            raw_duration = format_info.get("duration") if isinstance(format_info, dict) else None
            raw_rate = stream.get("sample_rate") if isinstance(stream, dict) else None
            raw_channels = stream.get("channels") if isinstance(stream, dict) else None
            return {
                "duration_seconds": float(raw_duration) if raw_duration is not None else None,
                "sample_rate": int(raw_rate) if raw_rate is not None else None,
                "channel_count": int(raw_channels) if raw_channels is not None else None,
            }
        except (OSError, ValueError, TypeError, json.JSONDecodeError, subprocess.TimeoutExpired):
            return {"duration_seconds": None, "sample_rate": None, "channel_count": None}

    def _inspect_wave(self, path: Path) -> dict[str, object]:
        try:
            with wave.open(str(path), "rb") as reader:
                frame_rate = reader.getframerate()
                frame_count = reader.getnframes()
                channels = reader.getnchannels()
                width = reader.getsampwidth()
                frames = reader.readframes(frame_count)
        except (wave.Error, EOFError, OSError) as error:
            raise ValueError("SOA-5008: 손상되었거나 지원하지 않는 WAV 파일입니다.") from error
        samples = self._decode_pcm(frames, width, channels)
        duration = frame_count / frame_rate if frame_rate else 0
        return self._summarize(samples, duration, frame_rate, channels)

    @staticmethod
    def _decode_pcm(frames: bytes, width: int, channels: int) -> list[float]:
        if width not in {1, 2, 3, 4} or channels < 1:
            raise ValueError("SOA-5008: 지원하지 않는 WAV PCM 형식입니다.")
        frame_width = width * channels
        values: list[float] = []
        for offset in range(0, len(frames) - frame_width + 1, frame_width):
            total = 0.0
            for channel in range(channels):
                start = offset + channel * width
                chunk = frames[start : start + width]
                if width == 1:
                    raw = chunk[0] - 128
                    scale = 128.0
                else:
                    raw = int.from_bytes(chunk, byteorder="little", signed=True)
                    scale = float(1 << (width * 8 - 1))
                total += raw / scale
            values.append(total / channels)
        return values

    @staticmethod
    def _summarize(
        samples,
        duration_seconds: float,
        sample_rate: object,
        channel_count: object,
    ) -> dict[str, object]:
        total = len(samples)
        if total <= 0:
            raise ValueError("SOA-5008: 디코딩된 음성 파형이 비어 있습니다.")
        squares = 0.0
        silent = 0
        clipped = 0
        for sample in samples:
            value = abs(float(sample))
            squares += value * value
            if value < _SILENCE_THRESHOLD:
                silent += 1
            if value >= _CLIPPING_THRESHOLD:
                clipped += 1
        rms = math.sqrt(squares / total)
        rms_db = 20 * math.log10(rms) if rms > 0 else -160.0
        silence_ratio = silent / total
        clipping_ratio = clipped / total
        status = "good"
        messages: list[str] = []

        if duration_seconds < 5:
            status = "blocked"
            messages.append("5초보다 짧아 목소리 특징을 안정적으로 추출하기 어렵습니다.")
        elif duration_seconds < 12:
            status = "warning"
            messages.append("12초 이상, 가능하면 20~30초를 녹음하면 음색 안정성이 좋아집니다.")
        elif duration_seconds < 20:
            status = "warning"
            messages.append("사용할 수 있지만 20~30초의 깨끗한 발화가 가장 안정적입니다.")
        if duration_seconds > _MAX_PROMPT_SECONDS:
            status = "blocked"
            messages.append(
                "CosyVoice3 기준 음성은 30초를 넘길 수 없습니다. "
                "20~30초 구간으로 잘라 주세요."
            )

        if silence_ratio > 0.85:
            status = "blocked"
            messages.append(
                "대부분이 무음입니다. 실제 말소리가 이어지는 샘플로 다시 녹음해 주세요."
            )
        elif silence_ratio > 0.58:
            if status == "good":
                status = "warning"
            messages.append("무음 구간이 많습니다. 말소리가 이어지는 구간을 권장합니다.")

        if clipping_ratio > 0.02:
            status = "blocked"
            messages.append("클리핑이 많아 음색이 왜곡됩니다. 입력 레벨을 낮춰 다시 녹음해 주세요.")
        elif clipping_ratio > 0.005:
            if status == "good":
                status = "warning"
            messages.append("일부 구간 입력이 너무 큽니다. 마이크에서 조금 멀어져 주세요.")

        if rms_db < -50:
            status = "blocked"
            messages.append("실제 발화 신호가 너무 작아 목소리 특징을 신뢰하기 어렵습니다.")
        elif rms_db < -38:
            if status == "good":
                status = "warning"
            messages.append("목소리가 작습니다. 조용한 곳에서 마이크 가까이 말해 주세요.")

        if isinstance(sample_rate, int) and sample_rate < 16_000:
            if status == "good":
                status = "warning"
            messages.append("16kHz 미만 샘플은 세부 음색 정보가 줄어들 수 있습니다.")
        if not messages:
            messages.append("서버 파형 재검증까지 통과한 복제용 샘플입니다.")

        return {
            "duration_seconds": round(duration_seconds, 2),
            "sample_rate": sample_rate if isinstance(sample_rate, int) else None,
            "channel_count": channel_count if isinstance(channel_count, int) else None,
            "rms_db": round(rms_db, 1),
            "silence_ratio": round(silence_ratio, 4),
            "clipping_ratio": round(clipping_ratio, 4),
            "status": status,
            "messages": messages,
        }

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
