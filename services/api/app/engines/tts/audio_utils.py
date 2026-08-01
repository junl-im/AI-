import wave
from pathlib import Path


class InvalidWaveError(RuntimeError):
    pass


def validate_wave(path: Path) -> None:
    if not path.is_file() or path.stat().st_size <= 44:
        raise InvalidWaveError("유효한 WAV 파일을 만들지 못했습니다.")
    try:
        with wave.open(str(path), "rb") as audio:
            if audio.getnchannels() < 1 or audio.getframerate() < 8000:
                raise InvalidWaveError("WAV 채널 또는 샘플레이트가 올바르지 않습니다.")
            if audio.getnframes() <= 0:
                raise InvalidWaveError("WAV에 음성 프레임이 없습니다.")
    except (EOFError, wave.Error) as error:
        raise InvalidWaveError("엔진 결과가 WAV 형식이 아닙니다.") from error


def wave_duration(path: Path) -> float:
    with wave.open(str(path), "rb") as audio:
        return audio.getnframes() / max(1, audio.getframerate())
