import math
import platform
import re
import shutil
import subprocess
import time
import wave
from pathlib import Path
from uuid import uuid4

from app.schemas.evidence import ExportSoakRecordRequest
from app.services.final_export import ExportInput, create_final_export
from app.storage.audio_store import AudioStore

_TIMESTAMP = re.compile(r"(?P<h>\d{2}):(?P<m>\d{2}):(?P<s>\d{2})[,.](?P<ms>\d{3})")


def _peak_memory_mb() -> float | None:
    try:
        import resource

        value = float(resource.getrusage(resource.RUSAGE_SELF).ru_maxrss)
        if platform.system() == "Darwin":
            return value / (1024 * 1024)
        return value / 1024
    except (ImportError, OSError, ValueError):
        return None


def _write_silent_wav(path: Path, seconds: float, sample_rate: int) -> None:
    total_frames = round(seconds * sample_rate)
    silence = b"\x80" * min(sample_rate, total_frames)
    with wave.open(str(path), "wb") as stream:
        stream.setnchannels(1)
        stream.setsampwidth(1)
        stream.setframerate(sample_rate)
        remaining = total_frames
        while remaining:
            frames = min(remaining, len(silence))
            stream.writeframesraw(silence[:frames])
            remaining -= frames



def _audio_duration(path: Path, output_format: str, fallback: float) -> tuple[float, str]:
    if output_format == "wav":
        with wave.open(str(path), "rb") as stream:
            return stream.getnframes() / stream.getframerate(), "wave"
    ffprobe = shutil.which("ffprobe")
    if ffprobe is None:
        return fallback, "export-contract"
    try:
        process = subprocess.run(
            [
                ffprobe, "-v", "error", "-show_entries", "format=duration",
                "-of", "default=noprint_wrappers=1:nokey=1", str(path),
            ],
            capture_output=True,
            text=True,
            check=False,
            timeout=60,
        )
    except subprocess.TimeoutExpired:
        return fallback, "export-contract"
    if process.returncode != 0:
        return fallback, "export-contract"
    try:
        return float(process.stdout.strip()), "ffprobe"
    except ValueError:
        return fallback, "export-contract"


def _last_subtitle_end(path: Path) -> float | None:
    matches = list(_TIMESTAMP.finditer(path.read_text(encoding="utf-8")))
    if not matches:
        return None
    value = matches[-1].groupdict()
    return (
        int(value["h"]) * 3600
        + int(value["m"]) * 60
        + int(value["s"])
        + int(value["ms"]) / 1000
    )


def run_export_soak_scenario(
    root: Path,
    sample_minutes: int,
    output_format: str,
    *,
    segment_seconds: int = 60,
    sample_rate: int = 8000,
    keep_artifacts: bool = False,
) -> ExportSoakRecordRequest:
    expected = float(sample_minutes * 60)
    store = AudioStore(root, ttl_minutes=24 * 60)
    inputs: list[ExportInput] = []
    source_paths: list[Path] = []
    result_paths: list[Path] = []
    started = time.perf_counter()
    try:
        segment_count = math.ceil(expected / segment_seconds)
        remaining = expected
        for index in range(segment_count):
            duration = min(float(segment_seconds), remaining)
            source = store.output_path(uuid4(), "wav")
            _write_silent_wav(source, duration, sample_rate)
            source_paths.append(source)
            inputs.append(ExportInput(
                filename=source.name,
                text=f"장문 Export 검증 구간 {index + 1}",
            ))
            remaining -= duration
        result = create_final_export(store, inputs, output_format)
        result_paths = [
            store.root / result.audio_filename,
            store.root / result.srt_filename,
            store.root / result.vtt_filename,
        ]
        processing = time.perf_counter() - started
        actual_duration, duration_source = _audio_duration(
            result_paths[0], output_format, result.duration_seconds
        )
        subtitle_end = _last_subtitle_end(result_paths[1])
        return ExportSoakRecordRequest(
            sample_minutes=sample_minutes,
            output_format=output_format,
            segment_count=segment_count,
            expected_duration_seconds=expected,
            actual_duration_seconds=actual_duration,
            processing_seconds=max(processing, 0.000001),
            peak_memory_mb=_peak_memory_mb(),
            output_bytes=sum(path.stat().st_size for path in result_paths),
            subtitle_end_seconds=subtitle_end,
            audio_duration_source=duration_source,
            succeeded=True,
            notes=f"synthetic-silence;sample-rate={sample_rate}",
        )
    except Exception as error:
        processing = time.perf_counter() - started
        return ExportSoakRecordRequest(
            sample_minutes=sample_minutes,
            output_format=output_format,
            segment_count=max(1, len(inputs)),
            expected_duration_seconds=expected,
            actual_duration_seconds=0,
            processing_seconds=max(processing, 0.000001),
            peak_memory_mb=_peak_memory_mb(),
            output_bytes=0,
            subtitle_end_seconds=None,
            audio_duration_source="export-contract",
            succeeded=False,
            notes=f"{type(error).__name__}: {error}"[:1000],
        )
    finally:
        if not keep_artifacts:
            for path in [*source_paths, *result_paths]:
                path.unlink(missing_ok=True)
