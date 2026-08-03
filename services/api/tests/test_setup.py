import wave

from app.services.setup_diagnostics import _voice_preset_check


def write_wav(path, *, seconds=1.2, sample_rate=24000, amplitude=1000):
    with wave.open(str(path), "wb") as audio:
        audio.setnchannels(1)
        audio.setsampwidth(2)
        audio.setframerate(sample_rate)
        frame = int(amplitude).to_bytes(2, "little", signed=True)
        audio.writeframes(frame * int(seconds * sample_rate))


def test_setup_status_explains_required_steps(client):
    response = client.get("/api/v1/setup")

    assert response.status_code == 200
    body = response.json()
    assert body["version"] == "0.9.3-beta.3"
    assert isinstance(body["ready"], bool)
    assert isinstance(body["real_engine_count"], int)
    assert body["voice_preset_expected_count"] == 5
    assert body["voice_preset_ready_count"] == 0
    assert len(body["voice_preset_diagnostics"]) == 5
    steps = {item["id"]: item for item in body["steps"]}
    assert steps["python"]["required"] is True
    assert steps["audio-directory"]["status"] == "ready"
    assert "real-engine" in steps
    assert "voice-presets" in steps
    assert "ffmpeg" in steps


def test_voice_preset_check_reports_individual_missing_files(tmp_path):
    write_wav(tmp_path / "sori-warm.wav")
    write_wav(tmp_path / "dam-calm.wav")

    step, ready_count, diagnostics = _voice_preset_check(tmp_path)

    assert ready_count == 2
    assert step.status == "warning"
    assert "2/5 사용 가능" in step.detail
    assert "on-clear" in step.detail
    assert next(item for item in diagnostics if item.voice_id == "on-clear").status == "missing"


def test_voice_preset_check_is_ready_with_all_five_files(tmp_path):
    for voice_id in ("sori-warm", "on-clear", "dam-calm", "jun-deep", "min-energetic"):
        write_wav(tmp_path / f"{voice_id}.wav")

    step, ready_count, diagnostics = _voice_preset_check(tmp_path)

    assert ready_count == 5
    assert step.status == "ready"
    assert "5/5 사용 가능" in step.detail
    assert all(item.usable for item in diagnostics)


def test_voice_preset_check_blocks_nearly_silent_audio(tmp_path):
    for voice_id in ("sori-warm", "on-clear", "dam-calm", "jun-deep", "min-energetic"):
        write_wav(tmp_path / f"{voice_id}.wav", amplitude=0)

    step, ready_count, diagnostics = _voice_preset_check(tmp_path)

    assert ready_count == 0
    assert step.status == "warning"
    assert all(item.status == "blocked" for item in diagnostics)
    assert all(any("무음" in issue for issue in item.issues) for item in diagnostics)
