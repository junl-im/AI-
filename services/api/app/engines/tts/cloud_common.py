import wave
from pathlib import Path
from uuid import UUID

import httpx

from app.schemas.tts import TtsSynthesisRequest, TtsSynthesisResponse
from app.storage.audio_store import AudioStore


class CloudTtsError(RuntimeError):
    pass


def response_detail(response: httpx.Response) -> str:
    try:
        payload = response.json()
    except ValueError:
        payload = None
    if isinstance(payload, dict):
        for key in ("detail", "message", "error"):
            value = payload.get(key)
            if isinstance(value, str) and value.strip():
                return value.strip()
            if isinstance(value, dict):
                nested = value.get("message")
                if isinstance(nested, str) and nested.strip():
                    return nested.strip()
    text = response.text.strip()
    return text[:300] if text else f"HTTP {response.status_code}"


def ensure_success(response: httpx.Response, provider: str) -> None:
    if response.is_success:
        return
    raise CloudTtsError(f"{provider} 응답 오류: {response_detail(response)}")


def write_wave_bytes(store: AudioStore, job_id: UUID, content: bytes) -> Path:
    output_path = store.output_path(job_id, "wav")
    output_path.write_bytes(content)
    validate_wave(output_path)
    return output_path


def write_pcm16_wave(
    store: AudioStore,
    job_id: UUID,
    content: bytes,
    sample_rate: int,
) -> Path:
    if not content:
        raise CloudTtsError("음성 공급자가 비어 있는 PCM을 반환했습니다.")
    output_path = store.output_path(job_id, "wav")
    with wave.open(str(output_path), "wb") as audio:
        audio.setnchannels(1)
        audio.setsampwidth(2)
        audio.setframerate(sample_rate)
        audio.writeframes(content)
    validate_wave(output_path)
    return output_path


def validate_wave(path: Path) -> None:
    if not path.is_file() or path.stat().st_size <= 44:
        raise CloudTtsError("유효한 WAV 파일을 만들지 못했습니다.")
    try:
        with wave.open(str(path), "rb") as audio:
            if audio.getnchannels() < 1 or audio.getframerate() < 8000:
                raise CloudTtsError("WAV 채널 또는 샘플레이트가 올바르지 않습니다.")
            if audio.getnframes() <= 0:
                raise CloudTtsError("WAV에 음성 프레임이 없습니다.")
    except (EOFError, wave.Error) as error:
        raise CloudTtsError("공급자 응답이 WAV 형식이 아닙니다.") from error


def wave_duration(path: Path) -> float:
    with wave.open(str(path), "rb") as audio:
        return audio.getnframes() / max(1, audio.getframerate())


def cloud_response(
    request: TtsSynthesisRequest,
    engine_id: str,
    output_path: Path,
    message: str,
) -> TtsSynthesisResponse:
    return TtsSynthesisResponse(
        job_id=str(request.job_id),
        status="completed",
        engine_id=engine_id,
        engine_mode="ai",
        audio_url=f"/api/v1/audio/{output_path.name}",
        estimated_duration_seconds=round(wave_duration(output_path), 1),
        message=message,
    )
