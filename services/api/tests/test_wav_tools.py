import wave
from pathlib import Path

from app.services.wav_tools import merge_wav_files


def _write_wave(path: Path, frames: int, sample_rate: int = 16000) -> None:
    with wave.open(str(path), "wb") as audio:
        audio.setnchannels(1)
        audio.setsampwidth(2)
        audio.setframerate(sample_rate)
        audio.writeframes(b"\x00\x00" * frames)


def test_merge_wav_files_adds_silence_and_keeps_valid_header(tmp_path):
    first = tmp_path / "first.wav"
    second = tmp_path / "second.wav"
    output = tmp_path / "merged.wav"
    _write_wave(first, 1600)
    _write_wave(second, 1600)

    duration = merge_wav_files([first, second], output, silence_ms=100)

    assert 0.29 <= duration <= 0.31
    with wave.open(str(output), "rb") as audio:
        assert audio.getnchannels() == 1
        assert audio.getframerate() == 16000
        assert audio.getnframes() == 4800
