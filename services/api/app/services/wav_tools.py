import wave
from pathlib import Path


def wav_duration_seconds(path: Path) -> float:
    with wave.open(str(path), "rb") as audio:
        return audio.getnframes() / max(1, audio.getframerate())


def merge_wav_files(inputs: list[Path], output: Path, silence_ms: int = 120) -> float:
    if not inputs:
        raise ValueError("병합할 WAV 파일이 없습니다.")

    reference = None
    frame_sets: list[bytes] = []
    for path in inputs:
        with wave.open(str(path), "rb") as audio:
            params = audio.getparams()
            signature = (params.nchannels, params.sampwidth, params.framerate, params.comptype)
            if reference is None:
                reference = signature
            elif signature != reference:
                raise ValueError("WAV 채널, 샘플 폭, 샘플레이트가 달라 병합할 수 없습니다.")
            frame_sets.append(audio.readframes(params.nframes))

    assert reference is not None
    channels, sample_width, sample_rate, _ = reference
    silence_frames = max(0, round(sample_rate * silence_ms / 1000))
    silence = b"\x00" * silence_frames * channels * sample_width

    output.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(output), "wb") as merged:
        merged.setnchannels(channels)
        merged.setsampwidth(sample_width)
        merged.setframerate(sample_rate)
        merged.setcomptype("NONE", "not compressed")
        for index, frames in enumerate(frame_sets):
            if index:
                merged.writeframes(silence)
            merged.writeframes(frames)
    return wav_duration_seconds(output)
