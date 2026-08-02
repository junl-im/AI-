import shutil
import subprocess
import wave
from dataclasses import dataclass
from pathlib import Path
from uuid import uuid4

from app.storage.audio_store import AudioStore

_CHUNK_FRAMES = 65_536


@dataclass(frozen=True)
class ExportInput:
    filename: str
    text: str
    pause_before_ms: int = 0
    pause_after_ms: int = 0


@dataclass(frozen=True)
class ExportResult:
    audio_filename: str
    srt_filename: str
    vtt_filename: str
    duration_seconds: float
    output_format: str
    ffmpeg_used: bool


def _timestamp(seconds: float, separator: str) -> str:
    total_ms = max(0, round(seconds * 1000))
    hours, remainder = divmod(total_ms, 3_600_000)
    minutes, remainder = divmod(remainder, 60_000)
    secs, millis = divmod(remainder, 1000)
    return f"{hours:02d}:{minutes:02d}:{secs:02d}{separator}{millis:03d}"


def _write_subtitles(
    entries: list[tuple[float, float, str]],
    srt_path: Path,
    vtt_path: Path,
) -> None:
    srt_lines: list[str] = []
    vtt_lines = ["WEBVTT", ""]
    for index, (start, end, text) in enumerate(entries, start=1):
        srt_lines.extend([
            str(index),
            f"{_timestamp(start, ',')} --> {_timestamp(end, ',')}",
            text.strip(),
            "",
        ])
        vtt_lines.extend([
            f"{_timestamp(start, '.')} --> {_timestamp(end, '.')}",
            text.strip(),
            "",
        ])
    srt_path.write_text("\n".join(srt_lines), encoding="utf-8")
    vtt_path.write_text("\n".join(vtt_lines), encoding="utf-8")


def _part_path(path: Path) -> Path:
    return path.with_name(f".{path.stem}.part{path.suffix}")


def _write_silence(output: wave.Wave_write, frames: int, frame_size: int) -> None:
    chunk = b"\x00" * min(_CHUNK_FRAMES, frames) * frame_size
    remaining = frames
    while remaining:
        count = min(remaining, _CHUNK_FRAMES)
        output.writeframesraw(chunk[:count * frame_size])
        remaining -= count


def _copy_frames(source: wave.Wave_read, output: wave.Wave_write) -> int:
    total = source.getnframes()
    remaining = total
    while remaining:
        frames = source.readframes(min(remaining, _CHUNK_FRAMES))
        if not frames:
            raise ValueError("WAV 프레임을 끝까지 읽지 못했습니다.")
        output.writeframesraw(frames)
        remaining -= len(frames) // (source.getnchannels() * source.getsampwidth())
    return total


def create_final_export(
    store: AudioStore,
    inputs: list[ExportInput],
    output_format: str,
) -> ExportResult:
    if not inputs:
        raise ValueError("내보낼 완료 음성 구간이 없습니다.")
    if output_format not in {"wav", "mp3"}:
        raise ValueError("WAV 또는 MP3 형식만 지원합니다.")
    resolved: list[tuple[ExportInput, Path]] = []
    for item in inputs:
        path = store.resolve(item.filename)
        if path is None or path.suffix.lower() != ".wav":
            raise ValueError(f"WAV 음원 파일을 찾을 수 없습니다: {item.filename}")
        resolved.append((item, path))

    export_id = uuid4()
    wav_path = store.output_path(export_id, "wav")
    srt_path = store.output_path(export_id, "srt")
    vtt_path = store.output_path(export_id, "vtt")
    wav_part = _part_path(wav_path)
    srt_part = _part_path(srt_path)
    vtt_part = _part_path(vtt_path)
    mp3_path = store.output_path(export_id, "mp3")
    mp3_part = _part_path(mp3_path)
    created = [wav_path, srt_path, vtt_path, mp3_path, wav_part, srt_part, vtt_part, mp3_part]
    entries: list[tuple[float, float, str]] = []
    elapsed_frames = 0
    audio_params: tuple[int, int, int] | None = None

    try:
        with wave.open(str(wav_part), "wb") as output:
            for item, path in resolved:
                with wave.open(str(path), "rb") as source:
                    params = (
                        source.getnchannels(),
                        source.getsampwidth(),
                        source.getframerate(),
                    )
                    if audio_params is None:
                        audio_params = params
                        output.setnchannels(params[0])
                        output.setsampwidth(params[1])
                        output.setframerate(params[2])
                    elif params != audio_params:
                        raise ValueError(
                            "모든 WAV 구간의 채널·샘플 폭·샘플레이트가 같아야 합니다."
                        )
                    frame_size = params[0] * params[1]
                    before_frames = round(params[2] * item.pause_before_ms / 1000)
                    if before_frames:
                        _write_silence(output, before_frames, frame_size)
                        elapsed_frames += before_frames
                    start = elapsed_frames / params[2]
                    elapsed_frames += _copy_frames(source, output)
                    end = elapsed_frames / params[2]
                    entries.append((start, end, item.text))
                    pause_frames = round(params[2] * item.pause_after_ms / 1000)
                    if pause_frames:
                        _write_silence(output, pause_frames, frame_size)
                        elapsed_frames += pause_frames

        if audio_params is None:
            raise ValueError("유효한 WAV 음원을 읽지 못했습니다.")
        _write_subtitles(entries, srt_part, vtt_part)
        wav_part.replace(wav_path)
        srt_part.replace(srt_path)
        vtt_part.replace(vtt_path)

        ffmpeg_used = False
        audio_path = wav_path
        if output_format == "mp3":
            ffmpeg = shutil.which("ffmpeg")
            if ffmpeg is None:
                raise RuntimeError(
                    "FFmpeg를 찾지 못해 MP3를 만들 수 없습니다. WAV로 내보내세요."
                )
            duration = elapsed_frames / audio_params[2]
            try:
                process = subprocess.run(
                    [
                        ffmpeg, "-nostdin", "-hide_banner", "-loglevel", "error",
                        "-y", "-i", str(wav_path), "-map_metadata", "-1",
                        "-codec:a", "libmp3lame", str(mp3_part),
                    ],
                    capture_output=True,
                    text=True,
                    check=False,
                    timeout=max(120, min(1800, round(duration * 2 + 60))),
                )
            except subprocess.TimeoutExpired as error:
                raise RuntimeError("FFmpeg MP3 변환 시간이 제한을 초과했습니다.") from error
            if process.returncode != 0:
                raise RuntimeError(process.stderr.strip() or "FFmpeg MP3 변환에 실패했습니다.")
            mp3_part.replace(mp3_path)
            wav_path.unlink(missing_ok=True)
            audio_path = mp3_path
            ffmpeg_used = True

        return ExportResult(
            audio_filename=audio_path.name,
            srt_filename=srt_path.name,
            vtt_filename=vtt_path.name,
            duration_seconds=elapsed_frames / audio_params[2],
            output_format=output_format,
            ffmpeg_used=ffmpeg_used,
        )
    except Exception:
        for path in created:
            path.unlink(missing_ok=True)
        raise
