def test_stt_regeneration_comparison_records_improvement(client):
    response = client.post(
        "/api/v1/quality/stt/regeneration-comparisons",
        json={
            "segment_id": "segment-1",
            "reference_text": "결제 금액은 38,500원입니다.",
            "before_transcript": "결제 금액은 35,800원입니다.",
            "after_transcript": "결제 금액은 38,500원입니다.",
            "model_id": "small",
            "device_profile": "cuda",
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["improved"] is True
    assert body["passed_after"] is True
    assert body["critical_error_improvement"] == 1

    summary = client.get(
        "/api/v1/quality/stt/regeneration-comparisons/summary"
    ).json()
    assert summary["total_records"] == 1
    assert summary["improved_records"] == 1


def test_export_soak_summary_tracks_required_scenarios(client):
    response = client.post(
        "/api/v1/quality/export-soak-records",
        json={
            "sample_minutes": 10,
            "output_format": "wav",
            "segment_count": 10,
            "expected_duration_seconds": 600,
            "actual_duration_seconds": 600,
            "processing_seconds": 2,
            "output_bytes": 1000,
            "subtitle_end_seconds": 600,
            "succeeded": True,
        },
    )

    assert response.status_code == 200
    assert response.json()["status"] == "ready"
    summary = client.get("/api/v1/quality/export-soak-records/summary").json()
    assert summary["total_records"] == 1
    assert "10m:wav" not in summary["missing_scenarios"]
    assert "60m:mp3" in summary["missing_scenarios"]


def test_evidence_bundle_redacts_device_name_and_notes(client):
    client.post(
        "/api/v1/quality/device-benchmarks",
        json={
            "device_profile": "cpu",
            "device_name": "Developer Personal Computer",
            "engine_id": "cosyvoice3",
            "model_id": "local",
            "model_version": "1",
            "sample_minutes": 10,
            "processing_seconds": 60,
            "audio_duration_seconds": 120,
            "succeeded": True,
            "notes": "private path",
        },
    )

    response = client.get("/api/v1/quality/evidence-bundle")

    assert response.status_code == 200
    body = response.json()
    assert body["redacted"] is True
    assert body["device_benchmarks"][0]["device_name"] == "cpu"
    assert body["device_benchmarks"][0]["notes"] == ""
