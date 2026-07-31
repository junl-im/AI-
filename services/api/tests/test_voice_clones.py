import json
import os
import wave
from datetime import datetime, timedelta, timezone
from io import BytesIO
from pathlib import Path
from uuid import UUID, uuid4

from app.storage.voice_clone_store import VoiceCloneStore


def wav_bytes(seconds: float = 5.2) -> bytes:
    output = BytesIO()
    with wave.open(output, "wb") as writer:
        writer.setnchannels(1)
        writer.setsampwidth(2)
        writer.setframerate(16_000)
        writer.writeframes(b"\x00\x00" * int(16_000 * seconds))
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
    assert body["recommended_seconds"] == 10
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
    assert body["status"] in {"sample-ready", "engine-unavailable"}
    assert list(tmp_path.glob(f"{profile_id}.*"))

    deleted = client.delete(f"/api/v1/voice-clones/profiles/{profile_id}")
    assert deleted.status_code == 200
    assert deleted.json()["deleted"] is True
    assert not list(tmp_path.glob(f"{profile_id}.*"))


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
