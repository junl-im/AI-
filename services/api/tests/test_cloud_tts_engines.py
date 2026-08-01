import base64
import io
import wave
from uuid import uuid4

import httpx
import pytest

from app.engines.tts.azure_speech import AzureSpeechTtsEngine
from app.engines.tts.elevenlabs import ElevenLabsTtsEngine
from app.engines.tts.google_chirp import GoogleChirpTtsEngine
from app.engines.tts.naver_clova import NaverClovaTtsEngine
from app.schemas.tts import TtsSynthesisRequest
from app.storage.audio_store import AudioStore


def wave_bytes(sample_rate: int = 24000) -> bytes:
    stream = io.BytesIO()
    with wave.open(stream, "wb") as audio:
        audio.setnchannels(1)
        audio.setsampwidth(2)
        audio.setframerate(sample_rate)
        audio.writeframes(b"\x00\x00" * 2400)
    return stream.getvalue()


def request():
    return TtsSynthesisRequest(
        text="오늘은 2026년 8월 1일입니다.",
        voice_id="sori-warm",
        emotion="calm",
        speed=1.05,
        pitch=2,
        job_id=uuid4(),
    )


@pytest.mark.asyncio
async def test_naver_clova_generates_wave(tmp_path):
    captured = {}

    def handler(http_request: httpx.Request) -> httpx.Response:
        captured["body"] = http_request.content.decode()
        return httpx.Response(200, content=wave_bytes())

    engine = NaverClovaTtsEngine(
        AudioStore(tmp_path, 30),
        "client-id",
        "client-secret",
        transport=httpx.MockTransport(handler),
    )
    result = await engine.synthesize(request())

    assert result.engine_id == "naver-clova"
    assert result.engine_mode == "ai"
    assert "emotion=0" in captured["body"]
    assert engine.info().korean_specialization == 100


@pytest.mark.asyncio
async def test_google_chirp_decodes_audio_content(tmp_path):
    content = wave_bytes()

    def handler(http_request: httpx.Request) -> httpx.Response:
        assert http_request.url.params["key"] == "google-key"
        assert "speakingRate" not in http_request.content.decode()
        return httpx.Response(200, json={"audioContent": base64.b64encode(content).decode()})

    engine = GoogleChirpTtsEngine(
        AudioStore(tmp_path, 30),
        "google-key",
        transport=httpx.MockTransport(handler),
    )
    result = await engine.synthesize(request())

    assert result.engine_id == "google-chirp3-hd"
    assert result.estimated_duration_seconds > 0
    assert engine.info().quality_tier == "premium"


@pytest.mark.asyncio
async def test_azure_speech_sends_korean_ssml(tmp_path):
    captured = {}

    def handler(http_request: httpx.Request) -> httpx.Response:
        captured["body"] = http_request.content.decode()
        captured["format"] = http_request.headers["X-Microsoft-OutputFormat"]
        return httpx.Response(200, content=wave_bytes())

    engine = AzureSpeechTtsEngine(
        AudioStore(tmp_path, 30),
        "azure-key",
        "koreacentral",
        transport=httpx.MockTransport(handler),
    )
    result = await engine.synthesize(request())

    assert result.engine_id == "azure-speech"
    assert 'xml:lang="ko-KR"' in captured["body"]
    assert 'pitch="+2st"' in captured["body"]
    assert captured["format"] == "riff-24khz-16bit-mono-pcm"


@pytest.mark.asyncio
async def test_elevenlabs_wraps_pcm_as_wave(tmp_path):
    captured = {}

    def handler(http_request: httpx.Request) -> httpx.Response:
        captured["url"] = str(http_request.url)
        captured["body"] = http_request.content.decode()
        return httpx.Response(200, content=b"\x00\x00" * 2400)

    store = AudioStore(tmp_path, 30)
    engine = ElevenLabsTtsEngine(
        store,
        "eleven-key",
        "korean-voice",
        transport=httpx.MockTransport(handler),
    )
    synthesis_request = request()
    result = await engine.synthesize(synthesis_request)

    assert result.engine_id == "elevenlabs-v3"
    assert "output_format=pcm_24000" in captured["url"]
    assert "[calm]" in captured["body"]
    with wave.open(str(store.output_path(synthesis_request.job_id)), "rb") as audio:
        assert audio.getframerate() == 24000
        assert audio.getnframes() == 2400


def test_cloud_engines_are_unavailable_without_credentials(tmp_path):
    store = AudioStore(tmp_path, 30)
    engines = [
        NaverClovaTtsEngine(store, "", ""),
        GoogleChirpTtsEngine(store, ""),
        AzureSpeechTtsEngine(store, "", ""),
        ElevenLabsTtsEngine(store, "", ""),
    ]

    assert all(not engine.info().ready for engine in engines)
