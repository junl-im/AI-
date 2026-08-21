from __future__ import annotations

import math
import wave
from dataclasses import dataclass
from pathlib import Path

MIN_DURATION_SECONDS = 5.0
MAX_DURATION_SECONDS = 30.0
RECOMMENDED_DURATION_SECONDS = 12.0
REQUIRED_SAMPLE_RATE = 16_000
MAX_FILE_BYTES = 25 * 1024 * 1024
SUPPORTED_SAMPLE_WIDTHS = {1, 2, 3, 4}
SILENCE_WARNING_RATIO = 0.58
SILENCE_BLOCK_RATIO = 0.85
CLIPPING_WARNING_RATIO = 0.005
CLIPPING_BLOCK_RATIO = 0.02
RMS_WARNING_DB = -38.0
RMS_BLOCK_DB = -50.0


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
    rms_db: float | None
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


def _signal_metrics(frames: bytes, sample_width: int) -> tuple[float, float, float]:
    sample_count = len(frames) // sample_width
    if sample_count <= 0:
        return 1.0, 0.0, -160.0
    scale = float(1 << (sample_width * 8 - 1))
    silent = 0
    clipped = 0
    squares = 0.0
    for offset in range(0, sample_count * sample_width, sample_width):
        sample = _decode_sample(frames[offset : offset + sample_width], sample_width)
        normalized = sample / scale
        absolute = abs(normalized)
        squares += normalized * normalized
        if absolute < 0.015:
            silent += 1
        if absolute >= 0.98:
            clipped += 1
    rms = math.sqrt(squares / sample_count)
    rms_db = 20 * math.log10(rms) if rms > 0 else -160.0
    return silent / sample_count, clipped / sample_count, rms_db


def _empty_inspection(
    path: Path,
    voice_id: str,
    status: str,
    issue: str,
) -> VoicePresetInspection:
    return VoicePresetInspection(
        voice_id=voice_id,
        filename=path.name,
        usable=False,
        status=status,
        duration_seconds=None,
        sample_rate=None,
        channel_count=None,
        sample_width_bits=None,
        rms_db=None,
        silence_ratio=None,
        clipping_ratio=None,
        issues=(issue,),
    )


def inspect_voice_preset(path: Path, voice_id: str) -> VoicePresetInspection:
    issues: list[str] = []
    if not path.is_file():
        return _empty_inspection(path, voice_id, "missing", "파일이 없습니다.")
    if path.stat().st_size > MAX_FILE_BYTES:
        return _empty_inspection(path, voice_id, "blocked", "25MB 이하 WAV만 사용할 수 있습니다.")

    try:
        with wave.open(str(path), "rb") as audio:
            channels = audio.getnchannels()
            sample_width = audio.getsampwidth()
            sample_rate = audio.getframerate()
            frame_count = audio.getnframes()
            duration = frame_count / sample_rate if sample_rate else 0.0
            frames = audio.readframes(frame_count)
    except (EOFError, OSError, wave.Error) as error:
        return _empty_inspection(
            path,
            voice_id,
            "blocked",
            f"손상되었거나 PCM WAV가 아닙니다: {error}",
        )

    if channels != 1:
        issues.append("CosyVoice 성우 기준 음성은 mono WAV여야 합니다.")
    if sample_width not in SUPPORTED_SAMPLE_WIDTHS:
        issues.append("8·16·24·32비트 PCM WAV만 지원합니다.")
    if sample_rate != REQUIRED_SAMPLE_RATE:
        issues.append("CosyVoice 성우 기준 음성은 16kHz WAV여야 합니다.")
    if not MIN_DURATION_SECONDS <= duration <= MAX_DURATION_SECONDS:
        issues.append("길이는 5초~30초여야 합니다.")
    elif duration < RECOMMENDED_DURATION_SECONDS:
        issues.append("사용할 수 있지만 12초 이상 기준 음성을 권장합니다.")
    if frame_count <= 0:
        issues.append("음성 프레임이 없습니다.")

    silence_ratio: float | None = None
    clipping_ratio: float | None = None
    rms_db: float | None = None
    if sample_width in SUPPORTED_SAMPLE_WIDTHS and frames:
        silence_ratio, clipping_ratio, rms_db = _signal_metrics(frames, sample_width)
        if silence_ratio > SILENCE_BLOCK_RATIO:
            issues.append("무음 비율이 85%를 넘어 기준 음성으로 사용할 수 없습니다.")
        elif silence_ratio > SILENCE_WARNING_RATIO:
            issues.append("무음 비율이 높습니다. 발화가 이어지는 구간을 권장합니다.")
        if clipping_ratio > CLIPPING_BLOCK_RATIO:
            issues.append("클리핑 비율이 2%를 넘어 음색 왜곡 위험이 큽니다.")
        elif clipping_ratio > CLIPPING_WARNING_RATIO:
            issues.append("일부 구간에 클리핑이 있습니다. 입력 레벨을 낮추는 편이 좋습니다.")
        if rms_db < RMS_BLOCK_DB:
            issues.append("발화 신호가 너무 작아 성우 음색을 신뢰하기 어렵습니다.")
        elif rms_db < RMS_WARNING_DB:
            issues.append("평균 음량이 낮습니다. 더 가까운 거리에서 녹음하는 편이 좋습니다.")

    blocked = (
        channels != 1
        or sample_width not in SUPPORTED_SAMPLE_WIDTHS
        or sample_rate != REQUIRED_SAMPLE_RATE
        or not MIN_DURATION_SECONDS <= duration <= MAX_DURATION_SECONDS
        or frame_count <= 0
        or (silence_ratio is not None and silence_ratio > SILENCE_BLOCK_RATIO)
        or (clipping_ratio is not None and clipping_ratio > CLIPPING_BLOCK_RATIO)
        or (rms_db is not None and rms_db < RMS_BLOCK_DB)
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
        rms_db=round(rms_db, 1) if rms_db is not None else None,
        silence_ratio=round(silence_ratio, 4) if silence_ratio is not None else None,
        clipping_ratio=round(clipping_ratio, 4) if clipping_ratio is not None else None,
        issues=tuple(issues),
    )
