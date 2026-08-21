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
    for index in range(sample_rate * 6):
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


def test_previous_trust_key_remains_valid_and_can_be_resigned(tmp_path):
    from app.schemas.voice_preset_approval import (
        VoicePresetResignApplyRequest,
        VoicePresetResignPreviewRequest,
    )

    preset_dir = tmp_path / "voice-presets"
    preset_dir.mkdir()
    audio = preset_dir / "on-clear.wav"
    _write_wave(audio)
    manifest_path = preset_dir / "on-clear.manifest.json"
    manifest_path.write_text(
        json.dumps(_manifest(_sha256(audio), audio.stat().st_size), ensure_ascii=False),
        encoding="utf-8",
    )
    history_path = tmp_path / "approval-history.jsonl"
    old_service = VoicePresetApprovalService(
        preset_dir,
        history_path,
        signing_secret="old-secret",
        signing_key_id="old-key",
    )
    base = VoicePresetApprovalInput(
        voice_id="on-clear",
        reviewer="reviewer-a",
        sample_text="같은 문장으로 도윤 음성을 검수했습니다.",
        review_bundle_sha256="c" * 64,
        expected_audio_sha256=_sha256(audio),
        reviewed_at=datetime(2026, 8, 5, 9, 0, tzinfo=timezone.utc),
    )
    approval_preview = old_service.preview(base)
    approved_record, _approved = old_service.apply(
        VoicePresetApprovalApplyRequest(
            **base.model_dump(),
            preview_id=approval_preview.preview_id,
            confirmation="현재 WAV 승인",
        ),
        actor="test-operator",
    )

    rotated_service = VoicePresetApprovalService(
        preset_dir,
        history_path,
        signing_secret="new-secret",
        signing_key_id="new-key",
        trusted_signing_keys={"old-key": "old-secret"},
    )
    evidence_before = inspect_voice_preset_evidence(
        preset_dir,
        get_voice_preset("on-clear"),
        inspect_voice_preset(audio, "on-clear"),
        "new-secret",
        "new-key",
        {"old-key": "old-secret"},
    )
    assert evidence_before.signature_status == "valid"
    assert evidence_before.ready is True

    queue = rotated_service.renewal_queue(60)
    renewal = next(item for item in queue.items if item.voice_id == "on-clear")
    assert renewal.priority == "rotation"
    assert renewal.can_resign is True
    assert renewal.current_key_id == "old-key"
    assert renewal.active_key_id == "new-key"

    resign_preview = rotated_service.preview_resign(
        VoicePresetResignPreviewRequest(
            voice_id="on-clear",
            expected_manifest_sha256=renewal.manifest_sha256,
        )
    )
    assert resign_preview.can_apply is True
    assert resign_preview.current_key_id == "old-key"
    assert resign_preview.active_key_id == "new-key"

    resign_record, resigned = rotated_service.apply_resign(
        VoicePresetResignApplyRequest(
            voice_id="on-clear",
            expected_manifest_sha256=resign_preview.current_manifest_sha256,
            resigned_at=resign_preview.resigned_at,
            preview_id=resign_preview.preview_id,
            confirmation="현재 키로 재서명",
        ),
        actor="test-operator",
    )
    assert resign_record.event == "re-signed"
    assert resign_record.related_approval_id == approved_record.approval_id
    assert resigned["approval"]["key_id"] == "new-key"

    evidence_after = inspect_voice_preset_evidence(
        preset_dir,
        get_voice_preset("on-clear"),
        inspect_voice_preset(audio, "on-clear"),
        "new-secret",
        "new-key",
        {"old-key": "old-secret"},
    )
    assert evidence_after.signature_status == "valid"
    assert evidence_after.ready is True

    rollback, restored = rotated_service.rollback(
        approved_record.approval_id,
        "승인 롤백",
        "교체 후 롤백 확인",
        "test-operator",
    )
    assert rollback.event == "rolled-back"
    assert restored["human_review"]["status"] == "pending"


def test_approval_preserves_v4_neural_preview_fingerprints(tmp_path):
    preset_dir = tmp_path / "voice-presets"
    preset_dir.mkdir()
    audio = preset_dir / "on-clear.wav"
    _write_wave(audio)
    payload = _manifest(_sha256(audio), audio.stat().st_size)
    payload["schema_version"] = 4
    payload["neural_preview"] = {
        "engine_id": "cosyvoice3",
        "model_id": "cosyvoice3-korean-preset",
        "model_fingerprint": "d" * 64,
        "reference_fingerprint": _sha256(audio),
        "notes": "rights-safe runtime fingerprint",
    }
    manifest_path = preset_dir / "on-clear.manifest.json"
    manifest_path.write_text(json.dumps(payload, ensure_ascii=False), encoding="utf-8")
    service = VoicePresetApprovalService(preset_dir, tmp_path / "history.jsonl")
    base = VoicePresetApprovalInput(
        voice_id="on-clear",
        reviewer="reviewer-v4",
        sample_text="도윤 neural reference를 같은 문장으로 검수했습니다.",
        review_bundle_sha256="e" * 64,
        expected_audio_sha256=_sha256(audio),
        reviewed_at=datetime(2026, 8, 19, 4, 0, tzinfo=timezone.utc),
    )

    preview = service.preview(base)
    _record, applied = service.apply(
        VoicePresetApprovalApplyRequest(
            **base.model_dump(),
            preview_id=preview.preview_id,
            confirmation="현재 WAV 승인",
        ),
        actor="test-operator",
    )

    assert applied["schema_version"] == 4
    assert applied["neural_preview"]["model_fingerprint"] == "d" * 64
    assert applied["neural_preview"]["reference_fingerprint"] == _sha256(audio)
