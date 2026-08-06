from __future__ import annotations

import json
from collections.abc import Mapping
from datetime import datetime, timezone
from pathlib import Path

from app.schemas.voice_preset_approval import (
    VoicePresetRenewalItem,
    VoicePresetRenewalQueueResponse,
)
from app.schemas.voice_preset_evidence import VoicePresetManifest
from app.services.voice_preset_approval_primitives import (
    days_remaining,
    manifest_digest,
    normalized_datetime,
)
from app.services.voice_preset_evidence import (
    inspect_voice_preset_evidence,
    sha256_file,
)
from app.services.voice_preset_validation import inspect_voice_preset
from app.services.voice_presets import PRESET_VOICE_IDS, get_voice_preset
from app.services.voice_review_trust import VoiceReviewTrustStore


class VoicePresetRenewalService:
    def __init__(
        self,
        directory: Path,
        signing_secret: str,
        signing_key_id: str,
        trusted_signing_keys: Mapping[str, str],
        trust_store: VoiceReviewTrustStore,
    ) -> None:
        self.directory = directory
        self.signing_secret = signing_secret
        self.signing_key_id = signing_key_id
        self.trusted_signing_keys = dict(trusted_signing_keys)
        self.trust_store = trust_store

    def build(self, warning_days: int = 60) -> VoicePresetRenewalQueueResponse:
        warning_days = max(1, min(warning_days, 365))
        now = datetime.now(timezone.utc)
        items: list[VoicePresetRenewalItem] = []
        for voice_id in PRESET_VOICE_IDS:
            item = self._inspect_voice(voice_id, warning_days, now)
            if item is not None:
                items.append(item)

        order = {"blocked": 0, "urgent": 1, "soon": 2, "rotation": 3}
        items.sort(key=lambda item: (order[item.priority], item.voice_id))
        return VoicePresetRenewalQueueResponse(
            generated_at=now,
            warning_days=warning_days,
            active_key_id=(
                self.trust_store.active_key_id if self.trust_store.can_sign else None
            ),
            trusted_key_ids=list(self.trust_store.trusted_key_ids),
            items=items,
        )

    def _inspect_voice(
        self,
        voice_id: str,
        warning_days: int,
        now: datetime,
    ) -> VoicePresetRenewalItem | None:
        profile = get_voice_preset(voice_id)
        manifest_path = self.directory / f"{voice_id}.manifest.json"
        audio_path = self.directory / f"{voice_id}.wav"
        reasons: list[str] = []
        priority = "rotation"
        manifest_sha256: str | None = None
        audio_sha256: str | None = None
        consent_expires_at = None
        rights_expires_at = None
        consent_days = None
        rights_days = None
        current_key_id: str | None = None
        can_resign = False

        if not manifest_path.is_file():
            reasons.append("manifest가 없어 동의·권리 상태를 확인할 수 없습니다.")
            priority = "blocked"
        else:
            try:
                raw = json.loads(manifest_path.read_text(encoding="utf-8"))
                if not isinstance(raw, dict):
                    raise ValueError("manifest 최상위 값이 객체가 아닙니다.")
                manifest_sha256 = manifest_digest(raw)
                manifest = VoicePresetManifest.model_validate(raw)
            except Exception as error:
                reasons.append(f"manifest를 검증하지 못했습니다: {error}")
                priority = "blocked"
            else:
                (
                    priority,
                    audio_sha256,
                    consent_expires_at,
                    rights_expires_at,
                    consent_days,
                    rights_days,
                    current_key_id,
                    can_resign,
                ) = self._inspect_manifest(
                    voice_id,
                    profile,
                    manifest,
                    audio_path,
                    warning_days,
                    now,
                    reasons,
                    priority,
                )

        if not reasons:
            return None
        return VoicePresetRenewalItem(
            voice_id=voice_id,
            display_name=profile.display_name,
            priority=priority,
            reasons=list(dict.fromkeys(reasons)),
            manifest_sha256=manifest_sha256,
            audio_sha256=audio_sha256,
            consent_expires_at=consent_expires_at,
            rights_expires_at=rights_expires_at,
            consent_days_remaining=consent_days,
            rights_days_remaining=rights_days,
            current_key_id=current_key_id,
            active_key_id=(
                self.trust_store.active_key_id if self.trust_store.can_sign else None
            ),
            can_resign=can_resign,
        )

    def _inspect_manifest(
        self,
        voice_id: str,
        profile: object,
        manifest: VoicePresetManifest,
        audio_path: Path,
        warning_days: int,
        now: datetime,
        reasons: list[str],
        priority: str,
    ) -> tuple[
        str,
        str | None,
        datetime | None,
        datetime | None,
        int | None,
        int | None,
        str | None,
        bool,
    ]:
        consent_expires_at = normalized_datetime(manifest.consent.expires_at)
        rights_expires_at = normalized_datetime(manifest.rights.expires_at)
        consent_days = days_remaining(consent_expires_at, now)
        rights_days = days_remaining(rights_expires_at, now)
        current_key_id = manifest.approval.key_id.strip() or None

        if manifest.consent.status != "confirmed":
            reasons.append(f"화자 동의 상태가 {manifest.consent.status}입니다.")
            priority = "blocked"
        priority = self._append_expiry_reason(
            reasons,
            priority,
            consent_days,
            warning_days,
            "화자 동의",
        )
        if "tts-inference" not in manifest.rights.allowed_uses:
            reasons.append("권리 범위에 tts-inference가 없습니다.")
            priority = "blocked"
        priority = self._append_expiry_reason(
            reasons,
            priority,
            rights_days,
            warning_days,
            "음성 사용 권리",
        )

        audio = inspect_voice_preset(audio_path, voice_id)
        audio_sha256: str | None = None
        if audio.usable:
            audio_sha256 = sha256_file(audio_path)
            if manifest.integrity.sha256.lower() != audio_sha256:
                reasons.append("manifest SHA-256와 현재 WAV가 다릅니다.")
                priority = "blocked"
            if (
                manifest.human_review.status == "approved"
                and manifest.human_review.audio_sha256.lower() != audio_sha256
            ):
                reasons.append("승인 당시 WAV와 현재 WAV가 달라 재검수가 필요합니다.")
                priority = "blocked"
        else:
            reasons.append("사용 가능한 WAV가 배치되지 않았습니다.")
            priority = "blocked"

        evidence = inspect_voice_preset_evidence(
            self.directory,
            profile,
            audio,
            self.signing_secret,
            self.signing_key_id,
            self.trusted_signing_keys,
        )
        if manifest.approval.mode == "hmac-sha256":
            if evidence.signature_status != "valid":
                reasons.append("현재 manifest 서명을 신뢰 키로 검증하지 못했습니다.")
                priority = "blocked"
            elif (
                self.trust_store.can_sign
                and current_key_id != self.trust_store.active_key_id
            ):
                reasons.append(
                    f"이전 신뢰 키 {current_key_id or '-'}에서 "
                    f"현재 키 {self.trust_store.active_key_id}로 재서명이 필요합니다."
                )
        elif manifest.human_review.status == "approved" and self.trust_store.can_sign:
            reasons.append("승인 manifest가 unsigned 상태여서 현재 키 서명이 필요합니다.")

        can_resign = bool(
            self.trust_store.can_sign
            and audio_sha256
            and manifest.human_review.status == "approved"
            and manifest.human_review.audio_sha256.lower() == audio_sha256
            and (
                manifest.approval.mode == "unsigned"
                or evidence.signature_status == "valid"
            )
            and (
                manifest.approval.mode == "unsigned"
                or current_key_id != self.trust_store.active_key_id
            )
        )
        return (
            priority,
            audio_sha256,
            consent_expires_at,
            rights_expires_at,
            consent_days,
            rights_days,
            current_key_id,
            can_resign,
        )

    @staticmethod
    def _append_expiry_reason(
        reasons: list[str],
        priority: str,
        days: int | None,
        warning_days: int,
        label: str,
    ) -> str:
        if days is None:
            return priority
        if days < 0:
            reasons.append(f"{label} 유효기간이 지났습니다.")
            return "blocked"
        if days <= warning_days:
            reasons.append(f"{label}가 {days}일 이내 만료됩니다.")
            if priority != "blocked":
                return "urgent" if days <= 7 else "soon"
        return priority
