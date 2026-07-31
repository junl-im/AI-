import wave
from pathlib import Path


def merge_wav_files(inputs: list[Path], output: Path) -> float:
    if not inputs:
        raise ValueError("합칠 WAV 구간이 없습니다.")
    params = None
    frames: list[bytes] = []
    total_frames = 0
    frame_rate = 0
    for path in inputs:
        with wave.open(str(path), "rb") as reader:
            current = (
                reader.getnchannels(),
                reader.getsampwidth(),
                reader.getframerate(),
            )
            if params is None:
                params = current
                frame_rate = reader.getframerate()
            elif current != params:
                raise ValueError("구간 WAV 형식이 서로 달라 병합할 수 없습니다.")
            frame_count = reader.getnframes()
            total_frames += frame_count
            frames.append(reader.readframes(frame_count))
    assert params is not None
    output.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(output), "wb") as writer:
        writer.setnchannels(params[0])
        writer.setsampwidth(params[1])
        writer.setframerate(params[2])
        for frame in frames:
            writer.writeframes(frame)
    return total_frames / frame_rate if frame_rate else 0
