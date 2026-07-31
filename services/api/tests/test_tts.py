def test_mock_tts_validates_contract(client):
    response = client.post(
        "/api/v1/tts/synthesize",
        json={
            "text": "안녕하세요. 소리온입니다.",
            "voice_id": "sori-warm",
            "emotion": "calm",
            "speed": 1.0,
            "pitch": 0,
            "output_format": "wav",
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "mock-complete"
    assert body["engine_id"] == "mock"
    assert body["audio_url"] is None
    assert body["estimated_duration_seconds"] >= 1


def test_tts_rejects_empty_text(client):
    response = client.post(
        "/api/v1/tts/synthesize",
        json={"text": "", "voice_id": "sori-warm"},
    )

    assert response.status_code == 422
