import hashlib
import json
import math
import struct
import wave
from datetime import datetime, timezone

import pytest

from app.schemas.voice_preset_approval import (
    VoicePresetApprovalApplyRequest,
    VoicePresetApprovalInput,
)
from app.services.voice_preset_approval import (
    VoicePresetApprovalError,
    VoicePresetApprovalService,
)
from app.services.voice_preset_evidence import inspect_voice_preset_evidence
from app.services.voice_preset_validation import inspect_voice_preset
from app.services.voice_presets import get_voice_preset


def _write_wave(path):
    sample_rate = 16000
    frames = []
    for index in range(sample_rate * 2):
        sample = round(math.sin(index / 20) * 5000)
        frames.append(struct.pack("<h", sample))
    with wave.open(str(path), "wb") as output:
        output.setnchannels(1)
        output.setsampwidth(2)
        output.setframerate(sample_rate)
        output.writeframes(b"".join(frames))


def _sha256(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def _manifest(audio_sha256, size):
    return {
        "schema_version": 2,
        "voice_id": "on-clear",
        "display_name": "도윤",
        "declared_gender": "male",
        "reference_file": "on-clear.wav",
        "consent": {
            "status": "confirmed",
            "subject_reference": "speaker-001",
            "evidence_reference": "consent://record/001",
            "consented_at": "2026-08-01T00:00:00Z",
            "expires_at": "2027-08-01T00:00:00Z",
            "notes": "",
        },
        "rights": {
            "source_type": "self-recorded",
            "source_reference": "rights://record/001",
            "allowed_uses": ["tts-inference"],
            "commercial_use": False,
            "redistribution": False,
            "training_use": False,
            "expires_at": "2027-08-01T00:00:00Z",
            "notes": "",
        },
        "integrity": {"sha256": audio_sha256, "file_size_bytes": size},
        "human_review": {
            "status": "pending",
            "reviewer": "",
            "reviewed_at": None,
            "sample_text": "",
            "audio_sha256": "",
            "source_review_bundle_sha256": "",
            "notes": "",
        },
    }


def test_signed_approval_preview_apply_and_rollback(tmp_path):
    preset_dir = tmp_path / "voice-presets"
    preset_dir.mkdir()
    audio = preset_dir / "on-clear.wav"
    _write_wave(audio)
    manifest_path = preset_dir / "on-clear.manifest.json"
    manifest_path.write_text(
        json.dumps(_manifest(_sha256(audio), audio.stat().st_size), ensure_ascii=False),
        encoding="utf-8",
    )
    service = VoicePresetApprovalService(
        preset_dir,
        tmp_path / "approval-history.jsonl",
        signing_secret="test-secret",
        signing_key_id="test-key",
    )
    reviewed_at = datetime(2026, 8, 5, 9, 0, tzinfo=timezone.utc)
    base = VoicePresetApprovalInput(
        voice_id="on-clear",
        reviewer="reviewer-a",
        sample_text="같은 문장으로 도윤 음성을 검수했습니다.",
        review_bundle_sha256="a" * 64,
        expected_audio_sha256=_sha256(audio),
        reviewed_at=reviewed_at,
        notes="운영자 수동 승인",
    )

    preview = service.preview(base)

    assert preview.can_apply is True
    assert preview.signature_mode == "hmac-sha256"
    assert preview.signing_key_id == "test-key"
    assert any(item.path == "human_review.status" for item in preview.changes)
    assert preview.proposed_manifest["approval"]["signature"]

    record, applied = service.apply(
        VoicePresetApprovalApplyRequest(
            **base.model_dump(),
            preview_id=preview.preview_id,
            confirmation="현재 WAV 승인",
        ),
        actor="test-operator",
    )

    assert record.event == "approved"
    assert record.signature_mode == "hmac-sha256"
    assert applied["schema_version"] == 3
    assert applied["human_review"]["status"] == "approved"
    assert applied["human_review"]["audio_sha256"] == _sha256(audio)
    assert len(service.list_history()) == 1
    evidence = inspect_voice_preset_evidence(
        preset_dir,
        get_voice_preset("on-clear"),
        inspect_voice_preset(audio, "on-clear"),
        "test-secret",
        "test-key",
    )
    assert evidence.signature_status == "valid"
    assert evidence.ready is True

    rollback, restored = service.rollback(
        record.approval_id,
        "승인 롤백",
        "잘못된 검수자 선택",
        "test-operator",
    )
    assert rollback.event == "rolled-back"
    assert rollback.related_approval_id == record.approval_id
    assert restored["human_review"]["status"] == "pending"
    assert len(service.list_history()) == 2


def test_approval_rejects_changed_audio_after_preview(tmp_path):
    preset_dir = tmp_path / "voice-presets"
    preset_dir.mkdir()
    audio = preset_dir / "on-clear.wav"
    _write_wave(audio)
    manifest_path = preset_dir / "on-clear.manifest.json"
    manifest_path.write_text(
        json.dumps(_manifest(_sha256(audio), audio.stat().st_size), ensure_ascii=False),
        encoding="utf-8",
    )
    service = VoicePresetApprovalService(preset_dir, tmp_path / "history.jsonl")
    base = VoicePresetApprovalInput(
        voice_id="on-clear",
        reviewer="reviewer-a",
        sample_text="검수 문장",
        review_bundle_sha256="b" * 64,
        expected_audio_sha256=_sha256(audio),
        reviewed_at=datetime(2026, 8, 5, 9, 0, tzinfo=timezone.utc),
    )
    preview = service.preview(base)
    audio.write_bytes(audio.read_bytes() + b"changed")

    with pytest.raises(VoicePresetApprovalError, match="WAV SHA-256"):
        service.apply(
            VoicePresetApprovalApplyRequest(
                **base.model_dump(),
                preview_id=preview.preview_id,
                confirmation="현재 WAV 승인",
            ),
            actor="test",
        )
