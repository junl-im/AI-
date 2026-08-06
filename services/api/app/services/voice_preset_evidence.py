from __future__ import annotations

import hashlib
import hmac
import json
from dataclasses import dataclass, replace
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Mapping

from pydantic import ValidationError

from app.schemas.voice_preset_evidence import VoicePresetManifest
from app.services.voice_preset_validation import VoicePresetInspection
from app.services.voice_presets import VoicePresetProfile
from app.services.voice_review_trust import VoiceReviewTrustStore

_SHA256_HEX_LENGTH = 64
_REQUIRED_INFERENCE_USE = "tts-inference"
_EXPIRY_WARNING_DAYS = 30


@dataclass(frozen=True)
class VoicePresetEvidenceInspection:
    voice_id: str
    manifest_filename: str
    schema_version: int | None
    status: str
    valid: bool
    consent_status: str
    human_review_status: str
    source_type: str
    allowed_uses: tuple[str, ...]
    declared_sha256: str | None
    actual_sha256: str | None
    checksum_matches: bool | None
    review_audio_sha256: str | None
    review_checksum_matches: bool | None
    approval_id: str | None
    signature_mode: str
    signing_key_id: str | None
    signature_status: str
    signed_payload_sha256: str | None
    consent_expires_at: datetime | None
    rights_expires_at: datetime | None
    consent_days_remaining: int | None
    rights_days_remaining: int | None
    duplicate_voice_ids: tuple[str, ...]
    issues: tuple[str, ...]

    @property
    def ready(self) -> bool:
        return self.status == "ready" and self.valid


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def _now_utc() -> datetime:
    return datetime.now(timezone.utc)


def _normalized(value: datetime | None) -> datetime | None:
    if value is None:
        return None
    return value if value.tzinfo is not None else value.replace(tzinfo=timezone.utc)


def _expired(value: datetime | None) -> bool:
    normalized = _normalized(value)
    return bool(normalized and normalized <= _now_utc())


def _days_remaining(value: datetime | None) -> int | None:
    normalized = _normalized(value)
    if normalized is None:
        return None
    delta = normalized - _now_utc()
    return max(0, int(delta.total_seconds() // 86400))


def _expires_soon(value: datetime | None) -> bool:
    normalized = _normalized(value)
    if normalized is None or normalized <= _now_utc():
        return False
    return normalized <= _now_utc() + timedelta(days=_EXPIRY_WARNING_DAYS)


def _valid_sha256(value: str | None) -> bool:
    return bool(
        value
        and len(value) == _SHA256_HEX_LENGTH
        and all(character in "0123456789abcdef" for character in value)
    )



def _canonical(value: object) -> bytes:
    return json.dumps(
        value,
        ensure_ascii=False,
        sort_keys=True,
        separators=(",", ":"),
    ).encode("utf-8")


def _signature_payload(manifest: VoicePresetManifest) -> dict[str, object]:
    payload = manifest.model_dump(mode="json")
    approval = payload.get("approval")
    if isinstance(approval, dict):
        approval["signature"] = ""
        approval["signed_payload_sha256"] = ""
    return payload


def _blocked_issue(issues: list[str], message: str) -> None:
    issues.append(f"차단: {message}")


def _warning_issue(issues: list[str], message: str) -> None:
    issues.append(f"확인: {message}")


def _empty_inspection(
    preset: VoicePresetProfile,
    manifest_filename: str,
    status: str,
    issues: tuple[str, ...],
    actual_sha256: str | None,
) -> VoicePresetEvidenceInspection:
    return VoicePresetEvidenceInspection(
        voice_id=preset.id,
        manifest_filename=manifest_filename,
        schema_version=None,
        status=status,
        valid=False,
        consent_status="missing" if status == "missing" else "invalid",
        human_review_status="missing" if status == "missing" else "invalid",
        source_type="unknown",
        allowed_uses=(),
        declared_sha256=None,
        actual_sha256=actual_sha256,
        checksum_matches=None,
        review_audio_sha256=None,
        review_checksum_matches=None,
        approval_id=None,
        signature_mode="unsigned",
        signing_key_id=None,
        signature_status="missing",
        signed_payload_sha256=None,
        consent_expires_at=None,
        rights_expires_at=None,
        consent_days_remaining=None,
        rights_days_remaining=None,
        duplicate_voice_ids=(),
        issues=issues,
    )


def inspect_voice_preset_evidence(
    directory: Path,
    preset: VoicePresetProfile,
    audio: VoicePresetInspection,
    signing_secret: str = "",
    signing_key_id: str = "",
    trusted_signing_keys: Mapping[str, str] | None = None,
) -> VoicePresetEvidenceInspection:
    trust_store = VoiceReviewTrustStore.build(
        active_secret=signing_secret,
        active_key_id=signing_key_id,
        trusted_keys=trusted_signing_keys,
    )
    manifest_path = directory / f"{preset.id}.manifest.json"
    actual_sha256 = sha256_file(directory / audio.filename) if audio.usable else None
    if not manifest_path.is_file():
        return _empty_inspection(
            preset,
            manifest_path.name,
            "missing",
            ("프리셋 manifest가 없습니다.",),
            actual_sha256,
        )

    try:
        raw = json.loads(manifest_path.read_text(encoding="utf-8"))
        manifest = VoicePresetManifest.model_validate(raw)
    except (OSError, json.JSONDecodeError, ValidationError) as error:
        return _empty_inspection(
            preset,
            manifest_path.name,
            "blocked",
            (f"manifest를 읽거나 검증하지 못했습니다: {error}",),
            actual_sha256,
        )

    issues: list[str] = []
    if manifest.schema_version < 2:
        _warning_issue(
            issues,
            "schema_version 1은 읽을 수 있지만 검수 SHA-256 결박이 없는 "
            "구형 형식입니다. 2로 마이그레이션하세요.",
        )
    if manifest.voice_id != preset.id:
        _blocked_issue(issues, f"voice_id가 {preset.id}와 다릅니다: {manifest.voice_id}")
    if manifest.display_name != preset.display_name:
        _blocked_issue(
            issues,
            f"display_name이 {preset.display_name}와 다릅니다: "
            f"{manifest.display_name}",
        )
    if manifest.declared_gender != preset.gender:
        _blocked_issue(
            issues,
            f"declared_gender가 {preset.gender}와 다릅니다: "
            f"{manifest.declared_gender}",
        )
    expected_reference = f"{preset.id}.wav"
    if Path(manifest.reference_file).name != expected_reference:
        _blocked_issue(
            issues,
            f"reference_file은 {expected_reference}여야 합니다: "
            f"{manifest.reference_file}",
        )

    consent_status = manifest.consent.status
    consent_expires_at = _normalized(manifest.consent.expires_at)
    consent_days_remaining = _days_remaining(consent_expires_at)
    if consent_status in {"rejected", "expired"}:
        _blocked_issue(issues, f"화자 동의 상태가 {consent_status}입니다.")
    elif consent_status != "confirmed":
        _warning_issue(issues, "화자 동의가 confirmed가 아닙니다.")
    if _expired(consent_expires_at):
        consent_status = "expired"
        _blocked_issue(issues, "화자 동의 유효기간이 지났습니다.")
    elif _expires_soon(consent_expires_at):
        _warning_issue(issues, f"화자 동의가 {consent_days_remaining}일 이내 만료됩니다.")
    if consent_status == "confirmed" and not manifest.consent.evidence_reference.strip():
        _warning_issue(issues, "동의 증거 참조가 비어 있습니다.")

    rights = manifest.rights
    rights_expires_at = _normalized(rights.expires_at)
    rights_days_remaining = _days_remaining(rights_expires_at)
    if rights.source_type == "unknown":
        _warning_issue(issues, "음성 출처 유형이 unknown입니다.")
    if not rights.source_reference.strip():
        _warning_issue(issues, "음성 출처 참조가 비어 있습니다.")
    if _REQUIRED_INFERENCE_USE not in rights.allowed_uses:
        _blocked_issue(issues, "allowed_uses에 tts-inference가 없습니다.")
    if _expired(rights_expires_at):
        _blocked_issue(issues, "음성 사용 권리 유효기간이 지났습니다.")
    elif _expires_soon(rights_expires_at):
        _warning_issue(issues, f"음성 사용 권리가 {rights_days_remaining}일 이내 만료됩니다.")

    declared_sha256 = manifest.integrity.sha256.strip().lower() or None
    checksum_matches: bool | None = None
    if declared_sha256 is None:
        _warning_issue(issues, "integrity.sha256가 비어 있습니다.")
    elif not _valid_sha256(declared_sha256):
        _blocked_issue(issues, "integrity.sha256가 64자리 소문자 SHA-256 형식이 아닙니다.")
    elif actual_sha256 is not None:
        checksum_matches = declared_sha256 == actual_sha256
        if not checksum_matches:
            _blocked_issue(
                issues,
                "manifest SHA-256와 실제 WAV SHA-256가 다릅니다. "
                "WAV 교체 뒤 재검수가 필요합니다.",
            )

    if audio.usable and manifest.integrity.file_size_bytes is not None:
        actual_size = (directory / audio.filename).stat().st_size
        if actual_size != manifest.integrity.file_size_bytes:
            _blocked_issue(
                issues,
                "manifest file_size_bytes와 실제 WAV 크기가 다릅니다. "
                "WAV 교체 뒤 재검수가 필요합니다.",
            )

    review_status = manifest.human_review.status
    review_audio_sha256 = manifest.human_review.audio_sha256.strip().lower() or None
    review_checksum_matches: bool | None = None
    approval_id = manifest.human_review.approval_id.strip() or None
    signature_mode = manifest.approval.mode
    signing_key = manifest.approval.key_id.strip() or None
    signed_payload_sha256 = manifest.approval.signed_payload_sha256.strip().lower() or None
    signature_status = "unsigned" if signature_mode == "unsigned" else "unverified"
    if review_status == "rejected":
        _blocked_issue(issues, "사람 청취 검수가 rejected입니다.")
    elif review_status != "approved":
        _warning_issue(issues, "사람 청취 검수가 approved가 아닙니다.")
    else:
        if not manifest.human_review.reviewer.strip():
            _warning_issue(issues, "승인 검수자 이름이 비어 있습니다.")
        if manifest.human_review.reviewed_at is None:
            _warning_issue(issues, "승인 검수 시각이 비어 있습니다.")
        if not _valid_sha256(review_audio_sha256):
            review_status = "stale"
            _blocked_issue(
                issues,
                "승인 검수에 audio_sha256가 없거나 형식이 잘못되었습니다. "
                "현재 WAV와 결박해 다시 검수하세요.",
            )
        elif actual_sha256 is not None:
            review_checksum_matches = review_audio_sha256 == actual_sha256
            if not review_checksum_matches:
                review_status = "stale"
                _blocked_issue(
                    issues,
                    "승인 당시 WAV와 현재 WAV의 SHA-256가 다릅니다. "
                    "기존 승인은 자동 무효화되었습니다.",
                )

    if review_status == "approved" and manifest.schema_version >= 3:
        if not approval_id:
            _blocked_issue(issues, "승인된 검수에 approval_id가 없습니다.")
        if signature_mode == "hmac-sha256":
            signature_payload = _signature_payload(manifest)
            actual_payload_sha256 = hashlib.sha256(_canonical(signature_payload)).hexdigest()
            if signed_payload_sha256 != actual_payload_sha256:
                signature_status = "invalid"
                _blocked_issue(issues, "서명 대상 payload SHA-256가 현재 manifest와 다릅니다.")
            elif not _valid_sha256(manifest.approval.signature.strip().lower()):
                signature_status = "invalid"
                _blocked_issue(issues, "HMAC 서명 형식이 올바르지 않습니다.")
            else:
                trusted_secret = trust_store.secret_for(signing_key)
                if trusted_secret is None and trust_store.trusted_key_ids:
                    signature_status = "invalid"
                    _blocked_issue(issues, "manifest signing key ID가 신뢰 키 목록에 없습니다.")
                elif trusted_secret is not None:
                    expected_signature = hmac.new(
                        trusted_secret,
                        _canonical(signature_payload),
                        hashlib.sha256,
                    ).hexdigest()
                    if not hmac.compare_digest(expected_signature, manifest.approval.signature):
                        signature_status = "invalid"
                        _blocked_issue(issues, "운영자 HMAC 서명을 검증하지 못했습니다.")
                    else:
                        signature_status = "valid"
                else:
                    _warning_issue(
                        issues,
                        "서명된 manifest이지만 로컬 신뢰 키가 없어 검증하지 못했습니다.",
                    )
        else:
            signature_status = "unsigned"

    blocked = any(issue.startswith("차단:") for issue in issues)
    warning = bool(issues)
    status = "blocked" if blocked else "warning" if warning else "ready"
    return VoicePresetEvidenceInspection(
        voice_id=preset.id,
        manifest_filename=manifest_path.name,
        schema_version=manifest.schema_version,
        status=status,
        valid=not blocked,
        consent_status=consent_status,
        human_review_status=review_status,
        source_type=rights.source_type,
        allowed_uses=tuple(rights.allowed_uses),
        declared_sha256=declared_sha256,
        actual_sha256=actual_sha256,
        checksum_matches=checksum_matches,
        review_audio_sha256=review_audio_sha256,
        review_checksum_matches=review_checksum_matches,
        approval_id=approval_id,
        signature_mode=signature_mode,
        signing_key_id=signing_key,
        signature_status=signature_status,
        signed_payload_sha256=signed_payload_sha256,
        consent_expires_at=consent_expires_at,
        rights_expires_at=rights_expires_at,
        consent_days_remaining=consent_days_remaining,
        rights_days_remaining=rights_days_remaining,
        duplicate_voice_ids=(),
        issues=tuple(issues),
    )


def mark_duplicate_checksums(
    inspections: list[VoicePresetEvidenceInspection],
) -> list[VoicePresetEvidenceInspection]:
    checksum_to_ids: dict[str, list[str]] = {}
    for item in inspections:
        if item.actual_sha256:
            checksum_to_ids.setdefault(item.actual_sha256, []).append(item.voice_id)

    results: list[VoicePresetEvidenceInspection] = []
    for item in inspections:
        duplicate_ids = tuple(
            voice_id
            for voice_id in checksum_to_ids.get(item.actual_sha256 or "", [])
            if voice_id != item.voice_id
        )
        if not duplicate_ids:
            results.append(item)
            continue
        issue = (
            "차단: 다른 프리셋과 WAV SHA-256가 같습니다: "
            + ", ".join(duplicate_ids)
            + ". 한 사람 음성을 여러 인물 프리셋에 중복 등록하지 않습니다."
        )
        results.append(replace(
            item,
            status="blocked",
            valid=False,
            duplicate_voice_ids=duplicate_ids,
            issues=(*item.issues, issue),
        ))
    return results
