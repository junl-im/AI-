import json
import math
import os
import struct
import wave
from datetime import datetime, timedelta, timezone
from io import BytesIO
from pathlib import Path
from uuid import UUID, uuid4

from app.storage.voice_clone_store import VoiceCloneStore


def wav_bytes(seconds: float = 5.2, *, silent: bool = False) -> bytes:
    output = BytesIO()
    frame_count = int(16_000 * seconds)
    with wave.open(output, "wb") as writer:
        writer.setnchannels(1)
        writer.setsampwidth(2)
        writer.setframerate(16_000)
        if silent:
            frames = b"\x00\x00" * frame_count
        else:
            frames = b"".join(
                struct.pack("<h", int(7_000 * math.sin(2 * math.pi * 220 * index / 16_000)))
                for index in range(frame_count)
            )
        writer.writeframes(frames)
    return output.getvalue()


def consent_payload(**overrides):
    payload = {
        "rights_confirmed": True,
        "disclosure_confirmed": True,
        "prohibited_use_confirmed": True,
        "consented_at": "2026-07-31T09:00:00Z",
        "allowed_purpose": "personal",
    }
    payload.update(overrides)
    return json.dumps(payload)


def analysis_payload(status="good"):
    return json.dumps(
        {
            "duration_seconds": 12,
            "sample_rate": 16000,
            "channel_count": 1,
            "rms_db": -19,
            "silence_ratio": 0.08,
            "clipping_ratio": 0,
            "status": status,
            "messages": ["복제 샘플로 사용하기 좋은 음질입니다."],
        }
    )


def test_voice_clone_capability_is_explicit(client):
    response = client.get("/api/v1/voice-clones/capabilities")
    assert response.status_code == 200
    body = response.json()
    assert body["engine_id"] == "cosyvoice3-worker"
    assert body["recommended_seconds"] == 25
    assert ".wav" in body["accepted_extensions"]


def test_voice_clone_profile_requires_all_consent(client):
    response = client.post(
        "/api/v1/voice-clones/profiles",
        data={
            "display_name": "내 목소리",
            "consent_json": consent_payload(rights_confirmed=False),
            "client_analysis_json": analysis_payload(),
        },
        files={"sample": ("sample.wav", wav_bytes(), "audio/wav")},
    )
    assert response.status_code == 403
    assert "SOA-5001" in response.json()["detail"]


def test_voice_clone_profile_rejects_blocked_sample(client):
    response = client.post(
        "/api/v1/voice-clones/profiles",
        data={
            "display_name": "내 목소리",
            "consent_json": consent_payload(),
            "client_analysis_json": analysis_payload("blocked"),
        },
        files={"sample": ("sample.wav", wav_bytes(), "audio/wav")},
    )
    assert response.status_code == 422
    assert "SOA-5007" in response.json()["detail"]


def test_voice_clone_profile_can_be_prepared_and_deleted(client, tmp_path: Path):
    client.app.state.voice_clone_store = VoiceCloneStore(tmp_path, 7, 1024 * 1024)
    response = client.post(
        "/api/v1/voice-clones/profiles",
        data={
            "display_name": "내 내레이션",
            "consent_json": consent_payload(),
            "client_analysis_json": analysis_payload(),
        },
        files={"sample": ("sample.wav", BytesIO(wav_bytes()), "audio/wav")},
    )
    assert response.status_code == 200
    body = response.json()
    profile_id = UUID(body["id"])
    assert body["status"] in {"engine-ready", "engine-unavailable"}
    assert body["server_analysis"]["status"] in {"good", "warning"}
    assert list(tmp_path.glob(f"{profile_id}.*"))

    deleted = client.delete(f"/api/v1/voice-clones/profiles/{profile_id}")
    assert deleted.status_code == 200
    assert deleted.json()["deleted"] is True
    assert not list(tmp_path.glob(f"{profile_id}.*"))


def test_voice_clone_profile_reuses_client_id_for_idempotent_retry(client, tmp_path: Path):
    client.app.state.voice_clone_store = VoiceCloneStore(tmp_path, 7, 1024 * 1024)
    profile_id = uuid4()
    request = {
        "data": {
            "display_name": "안정 복구",
            "consent_json": consent_payload(),
            "client_analysis_json": analysis_payload(),
            "client_profile_id": str(profile_id),
        },
        "files": {"sample": ("sample.wav", wav_bytes(), "audio/wav")},
    }
    first = client.post("/api/v1/voice-clones/profiles", **request)
    assert first.status_code == 200
    assert first.json()["id"] == str(profile_id)

    retry = client.post("/api/v1/voice-clones/profiles", **request)
    assert retry.status_code == 200
    assert retry.json()["id"] == str(profile_id)
    assert len(list(tmp_path.glob(f"{profile_id}.*"))) == 2


def test_saved_profile_status_recovers_when_worker_becomes_ready(
    client, tmp_path: Path, monkeypatch
):
    from app.engines.registry import engine_registry

    client.app.state.voice_clone_store = VoiceCloneStore(tmp_path, 7, 1024 * 1024)
    created = client.post(
        "/api/v1/voice-clones/profiles",
        data={
            "display_name": "복구 목소리",
            "consent_json": consent_payload(),
            "client_analysis_json": analysis_payload(),
        },
        files={"sample": ("sample.wav", wav_bytes(), "audio/wav")},
    )
    assert created.status_code == 200
    profile_id = created.json()["id"]
    engine = engine_registry.resolve_voice_clone("auto")

    async def probe_ready():
        engine._ready = True
        engine._reason = "준비됨"
        return True

    monkeypatch.setattr(engine, "probe", probe_ready)
    refreshed = client.get(f"/api/v1/voice-clones/profiles/{profile_id}")
    assert refreshed.status_code == 200
    assert refreshed.json()["status"] == "engine-ready"
    assert refreshed.json()["server_analysis"]["status"] in {"good", "warning"}


def test_voice_clone_profile_rejects_damaged_wav(client, tmp_path: Path):
    client.app.state.voice_clone_store = VoiceCloneStore(tmp_path, 7, 1024 * 1024)
    response = client.post(
        "/api/v1/voice-clones/profiles",
        data={
            "display_name": "손상 샘플",
            "consent_json": consent_payload(),
            "client_analysis_json": analysis_payload(),
        },
        files={"sample": ("sample.wav", b"not-a-wave", "audio/wav")},
    )
    assert response.status_code == 422
    assert "SOA-5008" in response.json()["detail"]


def test_voice_clone_profile_rejects_short_wav(client, tmp_path: Path):
    client.app.state.voice_clone_store = VoiceCloneStore(tmp_path, 7, 1024 * 1024)
    response = client.post(
        "/api/v1/voice-clones/profiles",
        data={
            "display_name": "짧은 샘플",
            "consent_json": consent_payload(),
            "client_analysis_json": analysis_payload(),
        },
        files={"sample": ("sample.wav", wav_bytes(2), "audio/wav")},
    )
    assert response.status_code == 422
    assert "SOA-5009" in response.json()["detail"]


def test_voice_clone_profile_rejects_silent_audio_even_if_client_claims_good(
    client, tmp_path: Path
):
    client.app.state.voice_clone_store = VoiceCloneStore(tmp_path, 7, 2 * 1024 * 1024)
    response = client.post(
        "/api/v1/voice-clones/profiles",
        data={
            "display_name": "무음 샘플",
            "consent_json": consent_payload(),
            "client_analysis_json": analysis_payload(),
        },
        files={"sample": ("sample.wav", wav_bytes(20, silent=True), "audio/wav")},
    )
    assert response.status_code == 422
    assert "SOA-5011" in response.json()["detail"]


def test_voice_clone_profile_rejects_reference_over_30_seconds(client, tmp_path: Path):
    client.app.state.voice_clone_store = VoiceCloneStore(tmp_path, 7, 4 * 1024 * 1024)
    response = client.post(
        "/api/v1/voice-clones/profiles",
        data={
            "display_name": "긴 샘플",
            "consent_json": consent_payload(),
            "client_analysis_json": analysis_payload(),
        },
        files={"sample": ("sample.wav", wav_bytes(30.5), "audio/wav")},
    )
    assert response.status_code == 422
    assert "SOA-5013" in response.json()["detail"]


def test_voice_clone_profile_rejects_unsupported_extension(client, tmp_path: Path):
    client.app.state.voice_clone_store = VoiceCloneStore(tmp_path, 7, 1024 * 1024)
    response = client.post(
        "/api/v1/voice-clones/profiles",
        data={
            "display_name": "잘못된 형식",
            "consent_json": consent_payload(),
            "client_analysis_json": analysis_payload(),
        },
        files={"sample": ("sample.txt", b"not-audio", "text/plain")},
    )
    assert response.status_code == 422
    assert "SOA-5002" in response.json()["detail"]


def test_voice_clone_profile_rejects_oversized_sample(client, tmp_path: Path):
    client.app.state.voice_clone_store = VoiceCloneStore(tmp_path, 7, 16)
    response = client.post(
        "/api/v1/voice-clones/profiles",
        data={
            "display_name": "큰 샘플",
            "consent_json": consent_payload(),
            "client_analysis_json": analysis_payload(),
        },
        files={"sample": ("sample.wav", b"0" * 17, "audio/wav")},
    )
    assert response.status_code == 422
    assert "SOA-5003" in response.json()["detail"]
    assert not list(tmp_path.iterdir())


def test_voice_clone_profile_rejects_empty_sample(client, tmp_path: Path):
    client.app.state.voice_clone_store = VoiceCloneStore(tmp_path, 7, 1024)
    response = client.post(
        "/api/v1/voice-clones/profiles",
        data={
            "display_name": "빈 샘플",
            "consent_json": consent_payload(),
            "client_analysis_json": analysis_payload(),
        },
        files={"sample": ("sample.wav", b"", "audio/wav")},
    )
    assert response.status_code == 422
    assert "SOA-5004" in response.json()["detail"]


def test_voice_clone_store_cleans_expired_profile_files(tmp_path: Path):
    store = VoiceCloneStore(tmp_path, ttl_days=1, max_file_bytes=1024)
    profile_id = uuid4()
    sample = tmp_path / f"{profile_id}.wav"
    metadata = tmp_path / f"{profile_id}.json"
    sample.write_bytes(b"sample")
    metadata.write_text("{}", encoding="utf-8")
    old = datetime.now(timezone.utc) - timedelta(days=2)
    timestamp = old.timestamp()
    os.utime(sample, (timestamp, timestamp))
    os.utime(metadata, (timestamp, timestamp))

    assert store.cleanup_expired() == 2
    assert not sample.exists()
    assert not metadata.exists()


def worker_job_payload(job_id: str, status: str = "running") -> dict:
    completed = status == "completed"
    return {
        "id": job_id,
        "profile_id": "profile-1",
        "status": status,
        "progress": 100 if completed else 45,
        "phase": "completed" if completed else "synthesizing",
        "message": "완료" if completed else "생성 중",
        "text": "첫 번째 문장입니다.",
        "created_at": "2026-07-31T00:00:00Z",
        "updated_at": "2026-07-31T00:00:01Z",
        "first_audio_ms": 820 if completed else None,
        "duration_seconds": 1.2 if completed else None,
        "audio_url": f"/v1/jobs/{job_id}/audio" if completed else None,
        "events_url": f"/v1/jobs/{job_id}/events",
        "error": None,
        "segments": [
            {
                "index": 1,
                "text": "첫 번째 문장입니다.",
                "status": "completed" if completed else "running",
                "progress": 100 if completed else 45,
                "message": "완료" if completed else "생성 중",
                "error": None,
                "audio_url": (
                    f"/v1/jobs/{job_id}/segments/1/audio" if completed else None
                ),
            }
        ],
    }


def prepare_profile_for_job(client, tmp_path: Path) -> str:
    client.app.state.voice_clone_store = VoiceCloneStore(tmp_path, 7, 1024 * 1024)
    response = client.post(
        "/api/v1/voice-clones/profiles",
        data={
            "display_name": "실행 목소리",
            "consent_json": consent_payload(),
            "client_analysis_json": analysis_payload(),
        },
        files={"sample": ("sample.wav", wav_bytes(), "audio/wav")},
    )
    assert response.status_code == 200
    return response.json()["id"]


def test_voice_clone_job_routes_proxy_worker(client, tmp_path: Path, monkeypatch):
    from app.engines.registry import engine_registry

    profile_id = prepare_profile_for_job(client, tmp_path)
    engine = engine_registry.resolve_voice_clone("auto")
    job_id = str(uuid4())

    async def probe():
        engine._ready = True
        engine._reason = "준비됨"
        return True

    async def create_job(_profile_id, text, sample_path):
        assert _profile_id == profile_id
        assert text == "첫 번째 문장입니다."
        assert sample_path.exists()
        return worker_job_payload(job_id)

    async def get_job(_job_id):
        assert _job_id == job_id
        return worker_job_payload(job_id, "completed")

    async def cancel_job(_job_id):
        return worker_job_payload(_job_id, "cancelled")

    async def retry_job(_job_id):
        return worker_job_payload(_job_id, "running")

    async def download_audio(_job_id, segment_index=None):
        assert _job_id == job_id
        assert segment_index in {None, 1}
        return wav_bytes(0.1)

    monkeypatch.setattr(engine, "probe", probe)
    monkeypatch.setattr(engine, "create_job", create_job)
    monkeypatch.setattr(engine, "get_job", get_job)
    monkeypatch.setattr(engine, "cancel_job", cancel_job)
    monkeypatch.setattr(engine, "retry_job", retry_job)
    monkeypatch.setattr(engine, "download_audio", download_audio)

    created = client.post(
        f"/api/v1/voice-clones/profiles/{profile_id}/jobs",
        json={"text": "첫 번째 문장입니다."},
    )
    assert created.status_code == 202
    assert created.json()["events_url"].endswith(f"/{job_id}/events")

    status_response = client.get(f"/api/v1/voice-clones/jobs/{job_id}")
    assert status_response.status_code == 200
    assert status_response.json()["status"] == "completed"
    assert status_response.json()["segments"][0]["audio_url"].endswith(
        f"/{job_id}/segments/1/audio"
    )

    cancelled = client.post(f"/api/v1/voice-clones/jobs/{job_id}/cancel")
    assert cancelled.json()["status"] == "cancelled"
    retried = client.post(f"/api/v1/voice-clones/jobs/{job_id}/retry")
    assert retried.json()["status"] == "running"

    audio = client.get(f"/api/v1/voice-clones/jobs/{job_id}/audio")
    assert audio.status_code == 200
    assert audio.content[:4] == b"RIFF"
    segment = client.get(f"/api/v1/voice-clones/jobs/{job_id}/segments/1/audio")
    assert segment.status_code == 200
    assert segment.content[:4] == b"RIFF"


def test_voice_clone_store_without_ffmpeg_requires_canonical_wav(tmp_path, monkeypatch):
    from app.storage import voice_clone_store as module

    profile_id = uuid4()
    store = VoiceCloneStore(tmp_path, ttl_days=7, max_file_bytes=4 * 1024 * 1024)
    path = tmp_path / f"{profile_id}.wav"
    output = BytesIO()
    sample_rate = 24_000
    with wave.open(output, "wb") as writer:
        writer.setnchannels(2)
        writer.setsampwidth(2)
        writer.setframerate(sample_rate)
        frame = struct.pack("<hh", 2400, 2400)
        writer.writeframes(frame * (sample_rate * 6))
    path.write_bytes(output.getvalue())
    monkeypatch.setattr(module.shutil, "which", lambda _name: None)

    try:
        store.normalize_for_engine(profile_id, path)
    except ValueError as error:
        assert "SOA-5016" in str(error)
        assert "16kHz mono" in str(error)
    else:
        raise AssertionError("비정규 WAV가 FFmpeg 없이 통과했습니다.")
