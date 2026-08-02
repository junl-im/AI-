from app.services.setup_diagnostics import _voice_preset_check


def test_setup_status_explains_required_steps(client):
    response = client.get("/api/v1/setup")

    assert response.status_code == 200
    body = response.json()
    assert body["version"] == "0.9.3-beta.3"
    assert isinstance(body["ready"], bool)
    assert isinstance(body["real_engine_count"], int)
    assert body["voice_preset_expected_count"] == 3
    assert body["voice_preset_ready_count"] == 0
    steps = {item["id"]: item for item in body["steps"]}
    assert steps["python"]["required"] is True
    assert steps["audio-directory"]["status"] == "ready"
    assert "real-engine" in steps
    assert "voice-presets" in steps
    assert "ffmpeg" in steps


def test_voice_preset_check_reports_individual_missing_files(tmp_path):
    (tmp_path / "sori-warm.wav").write_bytes(b"RIFF")
    (tmp_path / "dam-calm.wav").write_bytes(b"RIFF")

    step, ready_count = _voice_preset_check(tmp_path)

    assert ready_count == 2
    assert step.status == "warning"
    assert "2/3 준비" in step.detail
    assert "on-clear" in step.detail


def test_voice_preset_check_is_ready_with_all_three_files(tmp_path):
    for voice_id in ("sori-warm", "on-clear", "dam-calm"):
        (tmp_path / f"{voice_id}.wav").write_bytes(b"RIFF")

    step, ready_count = _voice_preset_check(tmp_path)

    assert ready_count == 3
    assert step.status == "ready"
    assert "3/3 준비" in step.detail
