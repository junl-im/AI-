import wave
from uuid import UUID, uuid4

from app.engines.base import TtsEngine
from app.main import app
from app.schemas.engine import EngineInfo
from app.schemas.tts import TtsSynthesisRequest, TtsSynthesisResponse


class PartialWaveEngine(TtsEngine):
    def info(self) -> EngineInfo:
        return EngineInfo(
            id="partial-test",
            name="Partial Test",
            kind="tts",
            mode="local",
            provider="test",
            languages=["ko-KR"],
            output_formats=["wav"],
            supports_emotion=False,
            supports_speed=True,
            supports_pitch=False,
            supports_voice_clone=False,
            ready=True,
        )

    async def synthesize(self, request: TtsSynthesisRequest) -> TtsSynthesisResponse:
        job_id = request.job_id or uuid4()
        path = app.state.audio_store.output_path(UUID(str(job_id)))
        with wave.open(str(path), "wb") as audio:
            audio.setnchannels(1)
            audio.setsampwidth(2)
            audio.setframerate(16000)
            audio.writeframes(b"\x00\x00" * 1600)
        return TtsSynthesisResponse(
            job_id=str(job_id),
            status="completed",
            engine_id="partial-test",
            engine_mode="local",
            audio_url=f"/api/v1/audio/{path.name}",
            estimated_duration_seconds=0.1,
            message="ok",
        )


class PartialOrchestrator:
    def __init__(self) -> None:
        self.engine = PartialWaveEngine()

    async def synthesize(self, request, runner):
        return await runner(self.engine, request)


def test_long_tts_publishes_signed_segment_audio(client, monkeypatch):
    monkeypatch.setattr(app.state, "engine_orchestrator", PartialOrchestrator())
    job_id = str(uuid4())
    response = client.post(
        "/api/v1/tts/synthesize",
        json={
            "text": "긴 문장의 첫 구간 음원을 먼저 전달합니다. " * 16,
            "voice_id": "sori-warm",
            "engine_id": "partial-test",
            "job_id": job_id,
        },
    )

    assert response.status_code == 200
    progress = client.get(f"/api/v1/tts/jobs/{job_id}")
    assert progress.status_code == 200
    segments = progress.json()["ready_segments"]
    assert len(segments) > 1
    assert segments[0]["index"] == 1
    assert segments[0]["ready_after_ms"] <= response.json()["processing_ms"]
    assert "signature=" in segments[0]["audio_url"]

    audio = client.get(segments[0]["audio_url"])
    assert audio.status_code == 200
    assert audio.headers["content-type"].startswith("audio/wav")
    assert audio.headers["x-sorion-segment-index"] == "1"

    tampered = segments[0]["audio_url"].replace("segments/1/", "segments/2/")
    denied = client.get(tampered)
    assert denied.status_code == 403

    stream = client.get(f"/api/v1/tts/jobs/{job_id}/events")
    assert stream.status_code == 200
    assert "event: segment-ready" in stream.text
    assert '"index":1' in stream.text
    assert '"phase":"completed"' in stream.text


def test_final_audio_url_uses_only_trusted_forwarded_origin(client, monkeypatch):
    monkeypatch.setattr(app.state, "engine_orchestrator", PartialOrchestrator())
    job_id = str(uuid4())
    response = client.post(
        "/api/v1/tts/synthesize",
        headers={
            "X-Forwarded-Proto": "https",
            "X-Forwarded-Host": "voice.example.com",
        },
        json={
            "text": "공개 브리지 최종 음원 주소를 확인합니다.",
            "voice_id": "sori-warm",
            "engine_id": "partial-test",
            "job_id": job_id,
        },
    )

    assert response.status_code == 200
    final_url = response.json()["audio_url"]
    assert final_url.startswith(
        f"https://voice.example.com/api/v1/tts/jobs/{job_id}/audio?"
    )
    assert "signature=" in final_url
    audio = client.get(final_url)
    assert audio.status_code == 200
    assert audio.headers["x-sorion-audio-rehydratable"] == "true"

    refreshed = client.get(f"/api/v1/tts/jobs/{job_id}/result")
    assert refreshed.status_code == 200
    assert "signature=" in refreshed.json()["audio_url"]

    denied = client.get(final_url.replace(f"jobs/{job_id}/", "jobs/tampered/"))
    assert denied.status_code == 403
