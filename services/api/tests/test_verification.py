def test_device_benchmark_is_recorded_and_listed(client):
    payload = {
        "device_profile": "cpu",
        "device_name": "Test CPU",
        "engine_id": "cosyvoice3",
        "model_id": "cosyvoice3-local",
        "model_version": "1",
        "sample_minutes": 10,
        "first_audio_ms": 1200,
        "processing_seconds": 60,
        "audio_duration_seconds": 120,
        "retry_count": 0,
        "failure_count": 0,
        "succeeded": True,
    }

    created = client.post("/api/v1/quality/device-benchmarks", json=payload)
    listed = client.get("/api/v1/quality/device-benchmarks")

    assert created.status_code == 200
    assert created.json()["status"] == "ready"
    assert created.json()["realtime_factor"] == 0.5
    assert listed.status_code == 200
    assert listed.json()[0]["device_name"] == "Test CPU"


def test_stt_measurement_marks_critical_error_for_regeneration(client):
    response = client.post(
        "/api/v1/quality/stt/measure",
        json={
            "reference_text": "결제 금액은 38,500원입니다.",
            "transcript_text": "결제 금액은 35,800원입니다.",
            "audio_duration_seconds": 10,
            "processing_seconds": 2,
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["critical_tokens"]["money"]["error_count"] == 1
    assert body["realtime_factor"] == 0.2
    assert body["needs_regeneration"] is True


def test_stt_probe_reports_optional_dependency_state(client):
    response = client.get("/api/v1/quality/stt/probe")

    assert response.status_code == 200
    assert response.json()["engine_id"] == "faster-whisper"


def test_stt_transcribe_rejects_oversized_upload(client):
    class ReadyProbe:
        engine_id = "faster-whisper"
        ready = True
        reason = "ready"

    class ReadyAdapter:
        model_name = "small"
        device = "cpu"
        compute_type = "int8"

        def probe(self):
            return ReadyProbe()

    client.app.state.stt_adapter = ReadyAdapter()
    client.app.state.settings.stt_max_file_bytes = 4

    response = client.post(
        "/api/v1/quality/stt/transcribe",
        data={"reference_text": "테스트"},
        files={"audio": ("sample.wav", b"12345", "audio/wav")},
    )

    assert response.status_code == 413
    assert "크기 제한" in response.json()["detail"]
