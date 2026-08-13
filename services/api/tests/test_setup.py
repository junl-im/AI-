import hashlib
import json
import wave

from app.services.setup_diagnostics import _voice_preset_check
from app.services.voice_presets import get_voice_preset


def write_wav(path, *, seconds=1.2, sample_rate=24000, amplitude=1000):
    with wave.open(str(path), "wb") as audio:
        audio.setnchannels(1)
        audio.setsampwidth(2)
        audio.setframerate(sample_rate)
        frame = int(amplitude).to_bytes(2, "little", signed=True)
        audio.writeframes(frame * int(seconds * sample_rate))


def write_approved_manifest(directory, voice_id):
    preset = get_voice_preset(voice_id)
    wav_path = directory / f"{voice_id}.wav"
    payload = {
        "schema_version": 2,
        "voice_id": voice_id,
        "display_name": preset.display_name,
        "declared_gender": preset.gender,
        "reference_file": wav_path.name,
        "consent": {
            "status": "confirmed",
            "subject_reference": f"test:{voice_id}",
            "evidence_reference": f"consent:{voice_id}",
            "consented_at": "2026-08-05T00:00:00Z",
            "expires_at": None,
            "notes": "test",
        },
        "rights": {
            "source_type": "self-recorded",
            "source_reference": f"recording:{voice_id}",
            "allowed_uses": ["tts-inference"],
            "commercial_use": False,
            "redistribution": False,
            "training_use": False,
            "expires_at": None,
            "notes": "test",
        },
        "integrity": {
            "sha256": hashlib.sha256(wav_path.read_bytes()).hexdigest(),
            "file_size_bytes": wav_path.stat().st_size,
        },
        "human_review": {
            "status": "approved",
            "reviewer": "tester",
            "reviewed_at": "2026-08-05T00:10:00Z",
            "sample_text": "공통 검수 문장",
            "audio_sha256": hashlib.sha256(wav_path.read_bytes()).hexdigest(),
            "source_review_bundle_sha256": "",
            "notes": "test",
        },
    }
    (directory / f"{voice_id}.manifest.json").write_text(
        json.dumps(payload, ensure_ascii=False),
        encoding="utf-8",
    )


def test_setup_status_explains_required_steps(client):
    response = client.get("/api/v1/setup")

    assert response.status_code == 200
    body = response.json()
    assert body["version"] == "0.11.15"
    assert isinstance(body["ready"], bool)
    assert isinstance(body["real_engine_count"], int)
    assert body["voice_preset_expected_count"] == 5
    assert body["voice_preset_ready_count"] == 0
    assert body["voice_preset_audio_ready_count"] == 0
    assert body["voice_preset_manifest_ready_count"] == 0
    assert body["voice_preset_duplicate_group_count"] == 0
    assert len(body["voice_preset_diagnostics"]) == 5
    steps = {item["id"]: item for item in body["steps"]}
    assert steps["python"]["required"] is True
    assert steps["audio-directory"]["status"] == "ready"
    assert "real-engine" in steps
    assert "voice-presets" in steps
    assert "ffmpeg" in steps


def test_voice_preset_check_reports_individual_missing_files(tmp_path):
    write_wav(tmp_path / "sori-warm.wav", amplitude=901)
    write_approved_manifest(tmp_path, "sori-warm")
    write_wav(tmp_path / "dam-calm.wav", amplitude=902)
    write_approved_manifest(tmp_path, "dam-calm")

    step, ready_count, diagnostics = _voice_preset_check(tmp_path)

    assert ready_count == 2
    assert step.status == "warning"
    assert "인증 완료 2/5" in step.detail
    assert "on-clear" in step.detail
    assert next(item for item in diagnostics if item.voice_id == "on-clear").status == "missing"


def test_voice_preset_check_is_ready_with_all_five_files(tmp_path):
    voice_ids = ("sori-warm", "on-clear", "dam-calm", "jun-deep", "min-energetic")
    for index, voice_id in enumerate(voice_ids, start=1):
        write_wav(tmp_path / f"{voice_id}.wav", amplitude=900 + index)
        write_approved_manifest(tmp_path, voice_id)

    step, ready_count, diagnostics = _voice_preset_check(tmp_path)

    assert ready_count == 5
    assert step.status == "ready"
    assert "인증 완료 5/5" in step.detail
    assert all(item.usable for item in diagnostics)
    assert all(item.checksum_matches is True for item in diagnostics)


def test_voice_preset_check_does_not_certify_wav_without_manifest(tmp_path):
    write_wav(tmp_path / "on-clear.wav")

    step, ready_count, diagnostics = _voice_preset_check(tmp_path)

    item = next(item for item in diagnostics if item.voice_id == "on-clear")
    assert ready_count == 0
    assert item.audio_usable is True
    assert item.manifest_status == "missing"
    assert item.usable is False
    assert "WAV 통과 1/5" in step.detail


def test_voice_preset_check_blocks_duplicate_wav_hashes(tmp_path):
    for voice_id in ("on-clear", "jun-deep"):
        write_wav(tmp_path / f"{voice_id}.wav", amplitude=1001)
        write_approved_manifest(tmp_path, voice_id)

    _, ready_count, diagnostics = _voice_preset_check(tmp_path)

    duplicates = [item for item in diagnostics if item.voice_id in {"on-clear", "jun-deep"}]
    assert ready_count == 0
    assert all(item.status == "blocked" for item in duplicates)
    assert all(item.duplicate_voice_ids for item in duplicates)
    assert all(any("중복 등록" in issue for issue in item.issues) for item in duplicates)


def test_voice_preset_check_blocks_nearly_silent_audio(tmp_path):
    for voice_id in ("sori-warm", "on-clear", "dam-calm", "jun-deep", "min-energetic"):
        write_wav(tmp_path / f"{voice_id}.wav", amplitude=0)

    step, ready_count, diagnostics = _voice_preset_check(tmp_path)

    assert ready_count == 0
    assert step.status == "warning"
    assert all(item.status == "blocked" for item in diagnostics)
    assert all(any("무음" in issue for issue in item.issues) for item in diagnostics)


def test_voice_preset_check_invalidates_review_after_wav_replacement(tmp_path):
    voice_id = "on-clear"
    wav_path = tmp_path / f"{voice_id}.wav"
    write_wav(wav_path, amplitude=900)
    write_approved_manifest(tmp_path, voice_id)
    write_wav(wav_path, amplitude=1200)

    _, ready_count, diagnostics = _voice_preset_check(tmp_path)

    item = next(value for value in diagnostics if value.voice_id == voice_id)
    assert ready_count == 0
    assert item.status == "blocked"
    assert item.human_review_status == "stale"
    assert item.review_checksum_matches is False
    assert any("자동 무효화" in issue for issue in item.issues)
