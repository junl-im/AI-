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


def test_device_benchmark_summary_reports_missing_scenarios(client):
    payload = {
        "device_profile": "cpu",
        "device_name": "Test CPU",
        "engine_id": "cosyvoice3",
        "model_id": "cosyvoice3-local",
        "model_version": "1",
        "sample_minutes": 10,
        "processing_seconds": 60,
        "audio_duration_seconds": 120,
        "succeeded": True,
    }
    client.post("/api/v1/quality/device-benchmarks", json=payload)

    response = client.get("/api/v1/quality/device-benchmarks/summary")

    assert response.status_code == 200
    body = response.json()
    assert body["total_records"] == 1
    assert body["ready_records"] == 1
    assert "cpu:10m" not in body["missing_scenarios"]
    assert "cuda:10m" in body["missing_scenarios"]


def test_stt_segment_verification_selects_only_failed_segments(client):
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

        def transcribe(self, path):
            if path.name == "good.wav":
                return "결제 금액은 38,500원입니다.", 10.0
            return "결제 금액은 35,800원입니다.", 10.0

    client.app.state.stt_adapter = ReadyAdapter()
    for filename in ["good.wav", "bad.wav"]:
        (client.app.state.settings.audio_path / filename).write_bytes(b"test")

    response = client.post(
        "/api/v1/quality/stt/verify-segments",
        json={
            "segments": [
                {
                    "segment_id": "good",
                    "audio_filename": "good.wav",
                    "reference_text": "결제 금액은 38,500원입니다.",
                },
                {
                    "segment_id": "bad",
                    "audio_filename": "bad.wav",
                    "reference_text": "결제 금액은 38,500원입니다.",
                },
            ],
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["regeneration_segment_ids"] == ["bad"]
    assert body["blocked_segment_ids"] == []
    assert body["results"][0]["needs_regeneration"] is False
    assert body["results"][1]["reasons"] == [
        "character_error_rate",
        "word_error_rate",
        "critical_token:money",
    ]


def test_stt_segment_verification_blocks_attempt_limit(client):
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

        def transcribe(self, path):
            return "완전히 다른 문장", 10.0

    client.app.state.stt_adapter = ReadyAdapter()
    (client.app.state.settings.audio_path / "bad.wav").write_bytes(b"test")

    response = client.post(
        "/api/v1/quality/stt/verify-segments",
        json={
            "max_regeneration_attempts": 2,
            "segments": [
                {
                    "segment_id": "bad",
                    "audio_filename": "bad.wav",
                    "reference_text": "원래 문장 123개",
                    "regeneration_attempts": 2,
                },
            ],
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["regeneration_segment_ids"] == []
    assert body["blocked_segment_ids"] == ["bad"]
    assert body["results"][0]["regeneration_allowed"] is False


def test_mobile_certification_requires_recovery_evidence(client):
    base = {
        "device_profile": "android",
        "device_name": "Pixel Test",
        "engine_id": "cosyvoice3",
        "model_id": "cosyvoice3-local",
        "model_version": "1",
        "sample_minutes": 10,
        "scenario": "network-switch",
        "processing_seconds": 60,
        "audio_duration_seconds": 120,
        "playback_completed": True,
        "succeeded": True,
    }
    warning = client.post(
        "/api/v1/quality/device-benchmarks",
        json=base,
    )
    failed = client.post(
        "/api/v1/quality/device-benchmarks",
        json={**base, "sse_reconnected": False, "audio_fetch_recovered": True},
    )
    ready = client.post(
        "/api/v1/quality/device-benchmarks",
        json={**base, "sse_reconnected": True, "audio_fetch_recovered": True},
    )

    assert warning.json()["status"] == "warning"
    assert failed.json()["status"] == "failed"
    assert ready.json()["status"] == "ready"

    summary = client.get("/api/v1/quality/device-benchmarks/summary").json()
    row = next(
        item for item in summary["certification_coverage"]
        if item["profile"] == "android"
        and item["scenario"] == "network-switch"
        and item["sample_minutes"] == 10
    )
    assert row["recorded"] is True
    assert row["latest_status"] == "ready"
    assert "android:network-switch:10m" not in summary["missing_certifications"]
