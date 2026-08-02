from __future__ import annotations

import wave
from dataclasses import dataclass
from pathlib import Path

MIN_DURATION_SECONDS = 1.0
MAX_DURATION_SECONDS = 30.0
MIN_SAMPLE_RATE = 16_000
MAX_SAMPLE_RATE = 48_000
MAX_FILE_BYTES = 25 * 1024 * 1024
SUPPORTED_SAMPLE_WIDTHS = {1, 2, 3, 4}


@dataclass(frozen=True)
class VoicePresetInspection:
    voice_id: str
    filename: str
    usable: bool
    status: str
    duration_seconds: float | None
    sample_rate: int | None
    channel_count: int | None
    sample_width_bits: int | None
    silence_ratio: float | None
    clipping_ratio: float | None
    issues: tuple[str, ...]


def _decode_sample(chunk: bytes, sample_width: int) -> int:
    if sample_width == 1:
        return chunk[0] - 128
    if sample_width == 3:
        value = int.from_bytes(chunk, byteorder="little", signed=False)
        if value & 0x800000:
            value -= 1 << 24
        return value
    return int.from_bytes(chunk, byteorder="little", signed=True)


def _signal_ratios(frames: bytes, sample_width: int) -> tuple[float, float]:
    sample_count = len(frames) // sample_width
    if sample_count <= 0:
        return 1.0, 0.0
    max_value = float((1 << (sample_width * 8 - 1)) - 1)
    silence_threshold = max_value * 0.01
    clipping_threshold = max_value * 0.995
    silent = 0
    clipped = 0
    for offset in range(0, sample_count * sample_width, sample_width):
        sample = abs(_decode_sample(frames[offset : offset + sample_width], sample_width))
        if sample <= silence_threshold:
            silent += 1
        if sample >= clipping_threshold:
            clipped += 1
    return silent / sample_count, clipped / sample_count


def inspect_voice_preset(path: Path, voice_id: str) -> VoicePresetInspection:
    issues: list[str] = []
    if not path.is_file():
        return VoicePresetInspection(
            voice_id=voice_id,
            filename=path.name,
            usable=False,
            status="missing",
            duration_seconds=None,
            sample_rate=None,
            channel_count=None,
            sample_width_bits=None,
            silence_ratio=None,
            clipping_ratio=None,
            issues=("파일이 없습니다.",),
        )
    if path.stat().st_size > MAX_FILE_BYTES:
        return VoicePresetInspection(
            voice_id=voice_id,
            filename=path.name,
            usable=False,
            status="blocked",
            duration_seconds=None,
            sample_rate=None,
            channel_count=None,
            sample_width_bits=None,
            silence_ratio=None,
            clipping_ratio=None,
            issues=("25MB 이하 WAV만 사용할 수 있습니다.",),
        )
    try:
        with wave.open(str(path), "rb") as audio:
            channels = audio.getnchannels()
            sample_width = audio.getsampwidth()
            sample_rate = audio.getframerate()
            frame_count = audio.getnframes()
            duration = frame_count / sample_rate if sample_rate else 0.0
            frames = audio.readframes(frame_count)
    except (EOFError, OSError, wave.Error) as error:
        return VoicePresetInspection(
            voice_id=voice_id,
            filename=path.name,
            usable=False,
            status="blocked",
            duration_seconds=None,
            sample_rate=None,
            channel_count=None,
            sample_width_bits=None,
            silence_ratio=None,
            clipping_ratio=None,
            issues=(f"손상되었거나 PCM WAV가 아닙니다: {error}",),
        )

    if channels not in {1, 2}:
        issues.append("모노 또는 스테레오 WAV가 필요합니다.")
    if sample_width not in SUPPORTED_SAMPLE_WIDTHS:
        issues.append("8·16·24·32비트 PCM WAV만 지원합니다.")
    if not MIN_SAMPLE_RATE <= sample_rate <= MAX_SAMPLE_RATE:
        issues.append("샘플레이트는 16kHz~48kHz여야 합니다.")
    if not MIN_DURATION_SECONDS <= duration <= MAX_DURATION_SECONDS:
        issues.append("길이는 1초~30초여야 합니다.")
    if frame_count <= 0:
        issues.append("음성 프레임이 없습니다.")

    silence_ratio: float | None = None
    clipping_ratio: float | None = None
    if sample_width in SUPPORTED_SAMPLE_WIDTHS and frames:
        silence_ratio, clipping_ratio = _signal_ratios(frames, sample_width)
        if silence_ratio >= 0.95:
            issues.append("전체의 95% 이상이 무음입니다.")
        elif silence_ratio >= 0.80:
            issues.append("무음 비율이 80% 이상입니다.")
        if clipping_ratio >= 0.10:
            issues.append("클리핑 비율이 10% 이상입니다.")
        elif clipping_ratio >= 0.02:
            issues.append("클리핑 비율이 2% 이상입니다.")

    blocked = (
        channels not in {1, 2}
        or sample_width not in SUPPORTED_SAMPLE_WIDTHS
        or not MIN_SAMPLE_RATE <= sample_rate <= MAX_SAMPLE_RATE
        or not MIN_DURATION_SECONDS <= duration <= MAX_DURATION_SECONDS
        or frame_count <= 0
        or (silence_ratio is not None and silence_ratio >= 0.95)
        or (clipping_ratio is not None and clipping_ratio >= 0.10)
    )
    status = "blocked" if blocked else "warning" if issues else "ready"
    return VoicePresetInspection(
        voice_id=voice_id,
        filename=path.name,
        usable=not blocked,
        status=status,
        duration_seconds=round(duration, 2),
        sample_rate=sample_rate,
        channel_count=channels,
        sample_width_bits=sample_width * 8,
        silence_ratio=round(silence_ratio, 4) if silence_ratio is not None else None,
        clipping_ratio=round(clipping_ratio, 4) if clipping_ratio is not None else None,
        issues=tuple(issues),
    )
