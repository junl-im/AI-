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


def ensure_trailing_silence(path: Path, minimum_ms: int) -> None:
    """Top up short PCM16 tails; never trim speech or double existing long pauses."""
    minimum_ms = max(0, min(340, minimum_ms))
    with wave.open(str(path), "rb") as audio:
        params = audio.getparams()
        if params.sampwidth != 2 or params.comptype != "NONE":
            return
        frames = audio.readframes(params.nframes)
    frame_width = params.nchannels * params.sampwidth
    target_frames = round(params.framerate * minimum_ms / 1000)
    quiet_frames = 0
    for index in range(params.nframes - 1, max(-1, params.nframes - target_frames - 1), -1):
        frame = frames[index * frame_width:(index + 1) * frame_width]
        if any(abs(int.from_bytes(frame[c:c + 2], "little", signed=True)) > 128
               for c in range(0, frame_width, 2)):
            break
        quiet_frames += 1
    missing = max(0, target_frames - quiet_frames)
    if not missing:
        return
    temporary = path.with_suffix(".breath.wav")
    try:
        with wave.open(str(temporary), "wb") as audio:
            audio.setparams(params)
            audio.writeframes(frames)
            audio.writeframes(b"\x00" * missing * frame_width)
        temporary.replace(path)
    finally:
        temporary.unlink(missing_ok=True)
