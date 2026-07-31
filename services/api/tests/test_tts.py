from uuid import uuid4


def test_mock_tts_validates_contract(client):
    job_id = str(uuid4())
    response = client.post(
        "/api/v1/tts/synthesize",
        json={
            "text": "안녕하세요. 소리온입니다.",
            "voice_id": "sori-warm",
            "emotion": "calm",
            "speed": 1.0,
            "pitch": 0,
            "output_format": "wav",
            "engine_id": "mock",
            "job_id": job_id,
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["job_id"] == job_id
    assert body["status"] == "mock-complete"
    assert body["engine_id"] == "mock"
    assert body["engine_mode"] == "mock"
    assert body["audio_url"] is None
    assert body["estimated_duration_seconds"] >= 1


def test_tts_rejects_empty_text(client):
    response = client.post(
        "/api/v1/tts/synthesize",
        json={"text": "", "voice_id": "sori-warm"},
    )

    assert response.status_code == 422


def test_unknown_engine_is_rejected(client):
    response = client.post(
        "/api/v1/tts/synthesize",
        json={"text": "안녕하세요", "voice_id": "sori-warm", "engine_id": "missing"},
    )

    assert response.status_code == 503
    assert "SOA-4001" in response.json()["detail"]


def test_cancel_unknown_job_is_safe(client):
    response = client.delete(f"/api/v1/tts/jobs/{uuid4()}")

    assert response.status_code == 200
    assert response.json()["cancelled"] is False
