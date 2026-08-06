from __future__ import annotations

import hashlib
import hmac
import json
import os
from collections.abc import Iterator, Mapping
from contextlib import contextmanager, nullcontext
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from threading import Lock
from uuid import uuid4

from app.schemas.voice_preset_approval import (
    VoicePresetApprovalApplyRequest,
    VoicePresetApprovalDiff,
    VoicePresetApprovalInput,
    VoicePresetApprovalPreviewResponse,
    VoicePresetApprovalRecord,
    VoicePresetRenewalItem,
    VoicePresetRenewalQueueResponse,
    VoicePresetResignApplyRequest,
    VoicePresetResignPreviewRequest,
    VoicePresetResignPreviewResponse,
)
from app.schemas.voice_preset_evidence import (
    VoiceApprovalSignatureRecord,
    VoiceHumanReviewRecord,
    VoicePresetManifest,
)
from app.services.interprocess_lock import (
    InterprocessLockTimeoutError,
    exclusive_file_lock,
)
from app.services.voice_preset_evidence import (
    inspect_voice_preset_evidence,
    mark_duplicate_checksums,
    sha256_file,
)
from app.services.voice_preset_validation import inspect_voice_preset
from app.services.voice_presets import PRESET_VOICE_IDS, get_voice_preset
from app.services.voice_review_trust import VoiceReviewTrustStore
from app.services.writer_lease import (
    SQLiteWriterLeaseCoordinator,
    WriterLease,
    WriterLeaseLostError,
    WriterLeaseTimeoutError,
)

_CONFIRM_APPROVAL = "현재 WAV 승인"
_CONFIRM_ROLLBACK = "승인 롤백"
_CONFIRM_RESIGN = "현재 키로 재서명"


class VoicePresetApprovalError(ValueError):
    pass


def _canonical(value: object) -> bytes:
    return json.dumps(
        value,
        ensure_ascii=False,
        sort_keys=True,
        separators=(",", ":"),
    ).encode("utf-8")


def _sha256_bytes(value: bytes) -> str:
    return hashlib.sha256(value).hexdigest()


def _valid_sha256(value: str) -> bool:
    return len(value) == 64 and all(character in "0123456789abcdef" for character in value)


def _manifest_digest(payload: dict[str, object]) -> str:
    return _sha256_bytes(_canonical(payload))


def _signature_payload(payload: dict[str, object]) -> dict[str, object]:
    value = json.loads(json.dumps(payload, ensure_ascii=False))
    approval = value.get("approval")
    if isinstance(approval, dict):
        approval["signature"] = ""
        approval["signed_payload_sha256"] = ""
    return value


def _diff(before: object, after: object, path: str = "") -> list[VoicePresetApprovalDiff]:
    if isinstance(before, dict) and isinstance(after, dict):
        rows: list[VoicePresetApprovalDiff] = []
        for key in sorted(set(before) | set(after)):
            child = f"{path}.{key}" if path else key
            rows.extend(_diff(before.get(key), after.get(key), child))
        return rows
    if before != after:
        return [VoicePresetApprovalDiff(path=path, before=before, after=after)]
    return []


def _normalized_datetime(value: datetime | None) -> datetime | None:
    if value is None:
        return None
    return value if value.tzinfo is not None else value.replace(tzinfo=timezone.utc)


def _days_remaining(value: datetime | None, now: datetime) -> int | None:
    normalized = _normalized_datetime(value)
    if normalized is None:
        return None
    return int((normalized - now).total_seconds() // 86400)


@dataclass(frozen=True)
class _PreparedApproval:
    response: VoicePresetApprovalPreviewResponse
    current_manifest: dict[str, object]
    proposed_manifest: dict[str, object]


@dataclass(frozen=True)
class _PreparedResign:
    response: VoicePresetResignPreviewResponse
    current_manifest: dict[str, object]
    proposed_manifest: dict[str, object]
    audio_sha256: str
    reviewer: str
    review_bundle_sha256: str
    related_approval_id: str | None


class VoicePresetApprovalService:
    def __init__(
        self,
        preset_directory: Path | None,
        history_path: Path,
        signing_secret: str = "",
        signing_key_id: str = "local-review-key",
        trusted_signing_keys: Mapping[str, str] | None = None,
        lock_timeout_seconds: float = 10.0,
        writer_lease: SQLiteWriterLeaseCoordinator | None = None,
    ) -> None:
        self.preset_directory = preset_directory
        self.history_path = history_path
        self.history_path.parent.mkdir(parents=True, exist_ok=True)
        self.signing_secret = signing_secret
        self.signing_key_id = signing_key_id.strip() or "local-review-key"
        self.trusted_signing_keys = dict(trusted_signing_keys or {})
        self.trust_store = VoiceReviewTrustStore.build(
            active_secret=signing_secret,
            active_key_id=self.signing_key_id,
            trusted_keys=self.trusted_signing_keys,
        )
        self.lock_timeout_seconds = max(0.1, lock_timeout_seconds)
        self.writer_lease = writer_lease
        self.lock_path = self.history_path.with_suffix(self.history_path.suffix + ".lock")
        self._lock = Lock()

    @contextmanager
    def _write_lock(self) -> Iterator[WriterLease | None]:
        with self._lock:
            try:
                lease_context = (
                    self.writer_lease.acquire(
                        "voice-preset-approval",
                        timeout_seconds=self.lock_timeout_seconds,
                    )
                    if self.writer_lease is not None
                    else nullcontext(None)
                )
                with lease_context as lease:
                    with exclusive_file_lock(
                        self.lock_path,
                        timeout_seconds=self.lock_timeout_seconds,
                    ):
                        yield lease
            except (InterprocessLockTimeoutError, WriterLeaseTimeoutError) as error:
                raise VoicePresetApprovalError(
                    "다른 API 프로세스가 프리셋 승인 파일을 변경 중입니다. "
                    "잠시 후 다시 시도하세요."
                ) from error

    def _assert_writer_lease(self, lease: WriterLease | None) -> None:
        if lease is None or self.writer_lease is None:
            return
        try:
            self.writer_lease.assert_current(lease)
        except WriterLeaseLostError as error:
            raise VoicePresetApprovalError(
                "승인 writer 권한이 만료되어 변경을 중단했습니다. "
                "다시 미리보기 하세요."
            ) from error

    def _require_directory(self) -> Path:
        if self.preset_directory is None:
            raise VoicePresetApprovalError(
                "CosyVoice 프리셋 폴더가 연결되지 않았습니다. "
                "SORION_COSYVOICE_PRESET_DIRECTORY를 설정하세요."
            )
        self.preset_directory.mkdir(parents=True, exist_ok=True)
        return self.preset_directory

    def _load_manifest(self, voice_id: str) -> tuple[Path, dict[str, object]]:
        directory = self._require_directory()
        path = directory / f"{voice_id}.manifest.json"
        if not path.is_file():
            raise VoicePresetApprovalError(f"{path.name}이 없어 승인할 수 없습니다.")
        try:
            payload = json.loads(path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError) as error:
            raise VoicePresetApprovalError(f"manifest를 읽지 못했습니다: {error}") from error
        if not isinstance(payload, dict):
            raise VoicePresetApprovalError("manifest 최상위 값은 객체여야 합니다.")
        try:
            VoicePresetManifest.model_validate(payload)
        except Exception as error:
            raise VoicePresetApprovalError(
                f"manifest schema 검증에 실패했습니다: {error}"
            ) from error
        return path, payload

    def _inspect_all(self):
        directory = self._require_directory()
        inspections = []
        for voice_id in PRESET_VOICE_IDS:
            profile = get_voice_preset(voice_id)
            audio = inspect_voice_preset(directory / f"{voice_id}.wav", voice_id)
            inspections.append(
                inspect_voice_preset_evidence(
                    directory,
                    profile,
                    audio,
                    self.signing_secret,
                    self.signing_key_id,
                    self.trusted_signing_keys,
                )
            )
        return mark_duplicate_checksums(inspections)

    def _prepare(self, payload: VoicePresetApprovalInput) -> _PreparedApproval:
        if payload.voice_id not in PRESET_VOICE_IDS:
            raise VoicePresetApprovalError(f"지원하지 않는 프리셋 ID입니다: {payload.voice_id}")
        review_digest = payload.review_bundle_sha256.lower()
        expected_audio = payload.expected_audio_sha256.lower()
        expected_manifest = (
            payload.expected_manifest_sha256.lower()
            if payload.expected_manifest_sha256
            else None
        )
        if not _valid_sha256(review_digest) or not _valid_sha256(expected_audio):
            raise VoicePresetApprovalError(
                "검수 묶음과 WAV checksum은 소문자 SHA-256이어야 합니다."
            )
        if expected_manifest and not _valid_sha256(expected_manifest):
            raise VoicePresetApprovalError("manifest checksum은 소문자 SHA-256이어야 합니다.")

        directory = self._require_directory()
        audio_path = directory / f"{payload.voice_id}.wav"
        audio = inspect_voice_preset(audio_path, payload.voice_id)
        if not audio.usable:
            detail = ", ".join(audio.issues) or audio.status
            raise VoicePresetApprovalError(f"현재 WAV를 승인할 수 없습니다: {detail}")
        current_audio_sha256 = sha256_file(audio_path)
        if current_audio_sha256 != expected_audio:
            raise VoicePresetApprovalError(
                "입력한 WAV SHA-256과 현재 파일이 다릅니다. "
                "파일을 다시 확인하고 미리보기를 갱신하세요."
            )

        _manifest_path, current = self._load_manifest(payload.voice_id)
        current_manifest_sha256 = _manifest_digest(current)
        if expected_manifest and current_manifest_sha256 != expected_manifest:
            raise VoicePresetApprovalError(
                "입력한 manifest SHA-256과 현재 파일이 다릅니다. 다른 변경을 덮어쓰지 않습니다."
            )

        all_inspections = self._inspect_all()
        evidence = next(item for item in all_inspections if item.voice_id == payload.voice_id)
        duplicate_ids = list(evidence.duplicate_voice_ids)
        ignored_review_phrases = (
            "사람 청취 검수",
            "승인 검수",
            "승인 당시 WAV",
            "기존 승인은 자동 무효화",
            "서명 대상 payload",
            "HMAC 서명",
            "signing key ID",
            "신뢰 키 목록",
        )
        blocking = [
            issue
            for issue in evidence.issues
            if issue.startswith("차단:")
            and not any(phrase in issue for phrase in ignored_review_phrases)
        ]
        warnings = [issue for issue in evidence.issues if issue.startswith("확인:")]
        if duplicate_ids:
            blocking.append("다른 인물 프리셋과 동일한 WAV는 승인할 수 없습니다.")

        manifest = VoicePresetManifest.model_validate(current)
        if manifest.consent.status != "confirmed":
            blocking.append("화자 동의가 confirmed가 아닙니다.")
        if not manifest.consent.evidence_reference.strip():
            blocking.append("동의 증거 참조가 비어 있습니다.")
        if "tts-inference" not in manifest.rights.allowed_uses:
            blocking.append("권리 범위에 tts-inference가 없습니다.")
        if not manifest.rights.source_reference.strip():
            blocking.append("음성 출처·권리 참조가 비어 있습니다.")
        if manifest.integrity.sha256.lower() != current_audio_sha256:
            blocking.append("manifest integrity.sha256가 현재 WAV와 일치하지 않습니다.")

        reviewed_at = payload.reviewed_at or datetime.now(timezone.utc)
        if reviewed_at.tzinfo is None:
            reviewed_at = reviewed_at.replace(tzinfo=timezone.utc)
        approval_seed = {
            "voice_id": payload.voice_id,
            "reviewer": payload.reviewer.strip(),
            "reviewed_at": reviewed_at.isoformat(),
            "audio_sha256": current_audio_sha256,
            "review_bundle_sha256": review_digest,
        }
        approval_id = "apr-" + _manifest_digest(approval_seed)[:24]
        proposed = manifest.model_copy(deep=True)
        proposed.schema_version = 3
        proposed.human_review = VoiceHumanReviewRecord(
            status="approved",
            reviewer=payload.reviewer.strip(),
            reviewed_at=reviewed_at,
            sample_text=payload.sample_text.strip(),
            audio_sha256=current_audio_sha256,
            source_review_bundle_sha256=review_digest,
            approval_id=approval_id,
            notes=payload.notes.strip(),
        )
        active_secret = self.trust_store.active_secret()
        signature_mode = "hmac-sha256" if active_secret else "unsigned"
        proposed.approval = VoiceApprovalSignatureRecord(
            mode=signature_mode,
            key_id=self.trust_store.active_key_id if active_secret else "",
            signed_at=reviewed_at,
            signed_payload_sha256="",
            signature="",
        )
        proposed_dict = proposed.model_dump(mode="json")
        signature_payload = _signature_payload(proposed_dict)
        signed_payload_sha256 = _manifest_digest(signature_payload)
        proposed_dict["approval"]["signed_payload_sha256"] = signed_payload_sha256
        if active_secret:
            proposed_dict["approval"]["signature"] = hmac.new(
                active_secret,
                _canonical(signature_payload),
                hashlib.sha256,
            ).hexdigest()
        proposed_manifest_sha256 = _manifest_digest(proposed_dict)
        preview_seed = {
            "voice_id": payload.voice_id,
            "audio_sha256": current_audio_sha256,
            "current_manifest_sha256": current_manifest_sha256,
            "proposed_manifest_sha256": proposed_manifest_sha256,
            "review_bundle_sha256": review_digest,
        }
        preview_id = _manifest_digest(preview_seed)
        response = VoicePresetApprovalPreviewResponse(
            preview_id=preview_id,
            approval_id=approval_id,
            voice_id=payload.voice_id,
            current_audio_sha256=current_audio_sha256,
            current_manifest_sha256=current_manifest_sha256,
            proposed_manifest_sha256=proposed_manifest_sha256,
            proposed_manifest=proposed_dict,
            changes=_diff(current, proposed_dict),
            blocking_issues=sorted(set(blocking)),
            warnings=sorted(set(warnings)),
            duplicate_voice_ids=duplicate_ids,
            signature_mode=signature_mode,
            signing_key_id=self.trust_store.active_key_id if active_secret else None,
            can_apply=not blocking,
        )
        return _PreparedApproval(response, current, proposed_dict)

    def preview(self, payload: VoicePresetApprovalInput) -> VoicePresetApprovalPreviewResponse:
        return self._prepare(payload).response

    def apply(
        self,
        payload: VoicePresetApprovalApplyRequest,
        actor: str,
    ) -> tuple[VoicePresetApprovalRecord, dict[str, object]]:
        if payload.confirmation != _CONFIRM_APPROVAL:
            raise VoicePresetApprovalError(
                f"확인 문구는 '{_CONFIRM_APPROVAL}'이어야 합니다."
            )
        base_payload = VoicePresetApprovalInput.model_validate(payload.model_dump())
        with self._write_lock() as lease:
            prepared = self._prepare(base_payload)
            if prepared.response.preview_id != payload.preview_id:
                raise VoicePresetApprovalError(
                    "미리보기 이후 WAV 또는 manifest 상태가 달라졌습니다. "
                    "다시 미리보기 하세요."
                )
            if not prepared.response.can_apply:
                raise VoicePresetApprovalError("차단 사유가 남아 있어 승인할 수 없습니다.")
            manifest_path, current = self._load_manifest(payload.voice_id)
            if _manifest_digest(current) != prepared.response.current_manifest_sha256:
                raise VoicePresetApprovalError(
                    "적용 직전 manifest가 변경되어 승인을 중단했습니다."
                )
            audio_path = self._require_directory() / f"{payload.voice_id}.wav"
            if sha256_file(audio_path) != prepared.response.current_audio_sha256:
                raise VoicePresetApprovalError(
                    "적용 직전 WAV가 변경되어 승인을 중단했습니다."
                )
            self._assert_writer_lease(lease)
            self._atomic_write(manifest_path, prepared.proposed_manifest)
            record = VoicePresetApprovalRecord(
                approval_id=prepared.response.approval_id,
                event="approved",
                voice_id=payload.voice_id,
                actor=actor,
                reviewer=payload.reviewer.strip(),
                at=datetime.now(timezone.utc),
                audio_sha256=prepared.response.current_audio_sha256,
                before_manifest_sha256=prepared.response.current_manifest_sha256,
                after_manifest_sha256=prepared.response.proposed_manifest_sha256,
                review_bundle_sha256=payload.review_bundle_sha256.lower(),
                signature_mode=prepared.response.signature_mode,
                signing_key_id=prepared.response.signing_key_id,
                signed_payload_sha256=(
                    str(
                        prepared.proposed_manifest.get("approval", {}).get(
                            "signed_payload_sha256"
                        )
                        or ""
                    )
                    or None
                ),
                signature=(
                    str(
                        prepared.proposed_manifest.get("approval", {}).get("signature")
                        or ""
                    )
                    or None
                ),
            )
            self._append_history(
                record,
                prepared.current_manifest,
                prepared.proposed_manifest,
            )
        return record, prepared.proposed_manifest

    def _prepare_resign(
        self,
        payload: VoicePresetResignPreviewRequest,
    ) -> _PreparedResign:
        if payload.voice_id not in PRESET_VOICE_IDS:
            raise VoicePresetApprovalError(f"지원하지 않는 프리셋 ID입니다: {payload.voice_id}")
        active_secret = self.trust_store.active_secret()
        if active_secret is None:
            raise VoicePresetApprovalError(
                "현재 active 신뢰 키 secret이 없어 재서명할 수 없습니다."
            )
        if payload.expected_manifest_sha256:
            expected = payload.expected_manifest_sha256.lower()
            if not _valid_sha256(expected):
                raise VoicePresetApprovalError("manifest checksum은 소문자 SHA-256이어야 합니다.")
        else:
            expected = None

        manifest_path, current = self._load_manifest(payload.voice_id)
        current_manifest_sha256 = _manifest_digest(current)
        if expected and expected != current_manifest_sha256:
            raise VoicePresetApprovalError(
                "입력한 manifest SHA-256과 현재 파일이 다릅니다. 다시 확인하세요."
            )
        manifest = VoicePresetManifest.model_validate(current)
        audio_path = self._require_directory() / f"{payload.voice_id}.wav"
        audio = inspect_voice_preset(audio_path, payload.voice_id)
        blocking: list[str] = []
        if not audio.usable:
            blocking.append("현재 WAV가 사용 가능한 상태가 아닙니다.")
            audio_sha256 = ""
        else:
            audio_sha256 = sha256_file(audio_path)
        if manifest.human_review.status != "approved":
            blocking.append("사람 청취 검수가 approved가 아닙니다.")
        if not manifest.human_review.approval_id.strip():
            blocking.append("기존 approval_id가 없습니다.")
        if audio_sha256 and manifest.human_review.audio_sha256.lower() != audio_sha256:
            blocking.append("승인 당시 WAV와 현재 WAV가 다릅니다. 재검수가 필요합니다.")

        evidence = inspect_voice_preset_evidence(
            self._require_directory(),
            get_voice_preset(payload.voice_id),
            audio,
            self.signing_secret,
            self.signing_key_id,
            self.trusted_signing_keys,
        )
        if manifest.approval.mode == "hmac-sha256" and evidence.signature_status != "valid":
            blocking.append("현재 manifest 서명을 신뢰 키로 검증하지 못했습니다.")
        if not evidence.valid:
            blocking.extend(
                issue.removeprefix("차단: ")
                for issue in evidence.issues
                if issue.startswith("차단:")
                and "서명" not in issue
                and "signing key" not in issue
                and "신뢰 키" not in issue
            )
        current_key_id = manifest.approval.key_id.strip() or None
        if (
            manifest.approval.mode == "hmac-sha256"
            and current_key_id == self.trust_store.active_key_id
            and evidence.signature_status == "valid"
        ):
            blocking.append("이미 현재 active 신뢰 키로 유효하게 서명되어 있습니다.")

        signed_at = payload.resigned_at or datetime.now(timezone.utc)
        if signed_at.tzinfo is None:
            signed_at = signed_at.replace(tzinfo=timezone.utc)
        proposed = manifest.model_copy(deep=True)
        proposed.schema_version = 3
        proposed.approval = VoiceApprovalSignatureRecord(
            mode="hmac-sha256",
            key_id=self.trust_store.active_key_id,
            signed_at=signed_at,
            signed_payload_sha256="",
            signature="",
        )
        proposed_dict = proposed.model_dump(mode="json")
        signature_payload = _signature_payload(proposed_dict)
        signed_payload_sha256 = _manifest_digest(signature_payload)
        proposed_dict["approval"]["signed_payload_sha256"] = signed_payload_sha256
        proposed_dict["approval"]["signature"] = hmac.new(
            active_secret,
            _canonical(signature_payload),
            hashlib.sha256,
        ).hexdigest()
        proposed_manifest_sha256 = _manifest_digest(proposed_dict)
        preview_id = _manifest_digest({
            "voice_id": payload.voice_id,
            "current_manifest_sha256": current_manifest_sha256,
            "proposed_manifest_sha256": proposed_manifest_sha256,
            "audio_sha256": audio_sha256,
            "active_key_id": self.trust_store.active_key_id,
        })
        response = VoicePresetResignPreviewResponse(
            preview_id=preview_id,
            voice_id=payload.voice_id,
            current_manifest_sha256=current_manifest_sha256,
            proposed_manifest_sha256=proposed_manifest_sha256,
            current_key_id=current_key_id,
            active_key_id=self.trust_store.active_key_id,
            resigned_at=signed_at,
            changes=_diff(current, proposed_dict),
            blocking_issues=sorted(set(blocking)),
            can_apply=not blocking,
        )
        return _PreparedResign(
            response=response,
            current_manifest=current,
            proposed_manifest=proposed_dict,
            audio_sha256=audio_sha256,
            reviewer=manifest.human_review.reviewer.strip(),
            review_bundle_sha256=manifest.human_review.source_review_bundle_sha256.lower(),
            related_approval_id=manifest.human_review.approval_id.strip() or None,
        )

    def preview_resign(
        self,
        payload: VoicePresetResignPreviewRequest,
    ) -> VoicePresetResignPreviewResponse:
        return self._prepare_resign(payload).response

    def apply_resign(
        self,
        payload: VoicePresetResignApplyRequest,
        actor: str,
    ) -> tuple[VoicePresetApprovalRecord, dict[str, object]]:
        if payload.confirmation != _CONFIRM_RESIGN:
            raise VoicePresetApprovalError(
                f"확인 문구는 '{_CONFIRM_RESIGN}'이어야 합니다."
            )
        base_payload = VoicePresetResignPreviewRequest.model_validate(payload.model_dump())
        with self._write_lock() as lease:
            prepared = self._prepare_resign(base_payload)
            if prepared.response.preview_id != payload.preview_id:
                raise VoicePresetApprovalError(
                    "재서명 미리보기 이후 manifest 또는 WAV 상태가 달라졌습니다."
                )
            if not prepared.response.can_apply:
                raise VoicePresetApprovalError("차단 사유가 남아 있어 재서명할 수 없습니다.")
            manifest_path, current = self._load_manifest(payload.voice_id)
            if _manifest_digest(current) != prepared.response.current_manifest_sha256:
                raise VoicePresetApprovalError(
                    "적용 직전 manifest가 변경되어 재서명을 중단했습니다."
                )
            current_audio_sha256 = sha256_file(
                self._require_directory() / f"{payload.voice_id}.wav"
            )
            if current_audio_sha256 != prepared.audio_sha256:
                raise VoicePresetApprovalError("적용 직전 WAV가 변경되어 재서명을 중단했습니다.")
            self._assert_writer_lease(lease)
            self._atomic_write(manifest_path, prepared.proposed_manifest)
            record_id = "resign-" + prepared.response.preview_id[:24]
            approval = prepared.proposed_manifest.get("approval", {})
            record = VoicePresetApprovalRecord(
                approval_id=record_id,
                event="re-signed",
                voice_id=payload.voice_id,
                actor=actor,
                reviewer=prepared.reviewer,
                at=datetime.now(timezone.utc),
                audio_sha256=prepared.audio_sha256,
                before_manifest_sha256=prepared.response.current_manifest_sha256,
                after_manifest_sha256=prepared.response.proposed_manifest_sha256,
                review_bundle_sha256=prepared.review_bundle_sha256,
                signature_mode="hmac-sha256",
                signing_key_id=self.trust_store.active_key_id,
                signed_payload_sha256=str(approval.get("signed_payload_sha256") or "") or None,
                signature=str(approval.get("signature") or "") or None,
                related_approval_id=prepared.related_approval_id,
            )
            self._append_history(record, prepared.current_manifest, prepared.proposed_manifest)
        return record, prepared.proposed_manifest

    def renewal_queue(self, warning_days: int = 60) -> VoicePresetRenewalQueueResponse:
        warning_days = max(1, min(warning_days, 365))
        now = datetime.now(timezone.utc)
        directory = self._require_directory()
        items: list[VoicePresetRenewalItem] = []
        for voice_id in PRESET_VOICE_IDS:
            profile = get_voice_preset(voice_id)
            manifest_path = directory / f"{voice_id}.manifest.json"
            audio_path = directory / f"{voice_id}.wav"
            reasons: list[str] = []
            priority = "rotation"
            manifest_digest: str | None = None
            audio_digest: str | None = None
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
                    manifest_digest = _manifest_digest(raw)
                    manifest = VoicePresetManifest.model_validate(raw)
                except Exception as error:
                    reasons.append(f"manifest를 검증하지 못했습니다: {error}")
                    priority = "blocked"
                else:
                    consent_expires_at = _normalized_datetime(manifest.consent.expires_at)
                    rights_expires_at = _normalized_datetime(manifest.rights.expires_at)
                    consent_days = _days_remaining(consent_expires_at, now)
                    rights_days = _days_remaining(rights_expires_at, now)
                    current_key_id = manifest.approval.key_id.strip() or None

                    if manifest.consent.status != "confirmed":
                        reasons.append(f"화자 동의 상태가 {manifest.consent.status}입니다.")
                        priority = "blocked"
                    if consent_days is not None:
                        if consent_days < 0:
                            reasons.append("화자 동의 유효기간이 지났습니다.")
                            priority = "blocked"
                        elif consent_days <= warning_days:
                            reasons.append(f"화자 동의가 {consent_days}일 이내 만료됩니다.")
                            if priority != "blocked":
                                priority = "urgent" if consent_days <= 7 else "soon"
                    if "tts-inference" not in manifest.rights.allowed_uses:
                        reasons.append("권리 범위에 tts-inference가 없습니다.")
                        priority = "blocked"
                    if rights_days is not None:
                        if rights_days < 0:
                            reasons.append("음성 사용 권리 유효기간이 지났습니다.")
                            priority = "blocked"
                        elif rights_days <= warning_days:
                            reasons.append(f"음성 사용 권리가 {rights_days}일 이내 만료됩니다.")
                            if priority != "blocked":
                                priority = "urgent" if rights_days <= 7 else "soon"

                    audio = inspect_voice_preset(audio_path, voice_id)
                    if audio.usable:
                        audio_digest = sha256_file(audio_path)
                        if manifest.integrity.sha256.lower() != audio_digest:
                            reasons.append("manifest SHA-256와 현재 WAV가 다릅니다.")
                            priority = "blocked"
                        if (
                            manifest.human_review.status == "approved"
                            and manifest.human_review.audio_sha256.lower() != audio_digest
                        ):
                            reasons.append("승인 당시 WAV와 현재 WAV가 달라 재검수가 필요합니다.")
                            priority = "blocked"
                    else:
                        reasons.append("사용 가능한 WAV가 배치되지 않았습니다.")
                        priority = "blocked"

                    evidence = inspect_voice_preset_evidence(
                        directory,
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
                    elif (
                        manifest.human_review.status == "approved"
                        and self.trust_store.can_sign
                    ):
                        reasons.append(
                            "승인 manifest가 unsigned 상태여서 현재 키 서명이 필요합니다."
                        )

                    can_resign = bool(
                        self.trust_store.can_sign
                        and audio_digest
                        and manifest.human_review.status == "approved"
                        and manifest.human_review.audio_sha256.lower() == audio_digest
                        and (
                            manifest.approval.mode == "unsigned"
                            or evidence.signature_status == "valid"
                        )
                        and (
                            manifest.approval.mode == "unsigned"
                            or current_key_id != self.trust_store.active_key_id
                        )
                    )

            if reasons:
                items.append(VoicePresetRenewalItem(
                    voice_id=voice_id,
                    display_name=profile.display_name,
                    priority=priority,
                    reasons=list(dict.fromkeys(reasons)),
                    manifest_sha256=manifest_digest,
                    audio_sha256=audio_digest,
                    consent_expires_at=consent_expires_at,
                    rights_expires_at=rights_expires_at,
                    consent_days_remaining=consent_days,
                    rights_days_remaining=rights_days,
                    current_key_id=current_key_id,
                    active_key_id=(
                        self.trust_store.active_key_id
                        if self.trust_store.can_sign
                        else None
                    ),
                    can_resign=can_resign,
                ))

        order = {"blocked": 0, "urgent": 1, "soon": 2, "rotation": 3}
        items.sort(key=lambda item: (order[item.priority], item.voice_id))
        return VoicePresetRenewalQueueResponse(
            generated_at=now,
            warning_days=warning_days,
            active_key_id=self.trust_store.active_key_id if self.trust_store.can_sign else None,
            trusted_key_ids=list(self.trust_store.trusted_key_ids),
            items=items,
        )

    def list_history(self, limit: int = 100) -> list[VoicePresetApprovalRecord]:
        return [
            VoicePresetApprovalRecord.model_validate(item["record"])
            for item in reversed(self._read_history()[-max(1, min(limit, 500)):])
            if isinstance(item.get("record"), dict)
        ]

    def rollback(
        self,
        approval_id: str,
        confirmation: str,
        reason: str,
        actor: str,
    ) -> tuple[VoicePresetApprovalRecord, dict[str, object]]:
        if confirmation != _CONFIRM_ROLLBACK:
            raise VoicePresetApprovalError(
                f"확인 문구는 '{_CONFIRM_ROLLBACK}'이어야 합니다."
            )
        with self._write_lock() as lease:
            history = self._read_history()
            source_index = next(
                (
                    index
                    for index in range(len(history) - 1, -1, -1)
                    if history[index].get("record", {}).get("approval_id") == approval_id
                    and history[index].get("record", {}).get("event") == "approved"
                ),
                None,
            )
            if source_index is None:
                raise VoicePresetApprovalError("롤백할 승인 기록을 찾지 못했습니다.")
            source = history[source_index]
            record = VoicePresetApprovalRecord.model_validate(source["record"])
            before = source.get("before_manifest")
            after = source.get("after_manifest")
            if not isinstance(before, dict) or not isinstance(after, dict):
                raise VoicePresetApprovalError(
                    "승인 기록에 복원 가능한 manifest snapshot이 없습니다."
                )
            expected_after_sha256 = record.after_manifest_sha256
            for item in history[source_index + 1:]:
                child = item.get("record", {})
                if (
                    isinstance(child, dict)
                    and child.get("event") == "re-signed"
                    and child.get("related_approval_id") == approval_id
                ):
                    expected_after_sha256 = str(
                        child.get("after_manifest_sha256")
                        or expected_after_sha256
                    )
            manifest_path, current = self._load_manifest(record.voice_id)
            current_digest = _manifest_digest(current)
            if current_digest != expected_after_sha256:
                raise VoicePresetApprovalError(
                    "승인 이후 manifest가 변경되었습니다. "
                    "최신 변경을 자동 덮어쓰지 않습니다."
                )
            audio_path = self._require_directory() / f"{record.voice_id}.wav"
            if sha256_file(audio_path) != record.audio_sha256:
                raise VoicePresetApprovalError(
                    "승인 이후 WAV가 변경되었습니다. 과거 manifest를 자동 복원하지 않습니다."
                )
            rollback_id = str(uuid4())
            rollback_manifest = json.loads(json.dumps(before, ensure_ascii=False))
            notes = rollback_manifest.setdefault("human_review", {}).get("notes", "")
            rollback_manifest["human_review"]["notes"] = (
                f"{notes}\n롤백 사유: {reason.strip()}".strip()
            )
            rollback_record = VoicePresetApprovalRecord(
                approval_id=rollback_id,
                event="rolled-back",
                voice_id=record.voice_id,
                actor=actor,
                reviewer=record.reviewer,
                at=datetime.now(timezone.utc),
                audio_sha256=record.audio_sha256,
                before_manifest_sha256=current_digest,
                after_manifest_sha256=_manifest_digest(rollback_manifest),
                review_bundle_sha256=record.review_bundle_sha256,
                signature_mode="unsigned",
                related_approval_id=approval_id,
            )
            self._assert_writer_lease(lease)
            self._atomic_write(manifest_path, rollback_manifest)
            self._append_history(rollback_record, current, rollback_manifest)
        return rollback_record, rollback_manifest

    def _atomic_write(self, path: Path, payload: dict[str, object]) -> None:
        temporary = path.with_name(f".{path.name}.{os.getpid()}.tmp")
        try:
            with temporary.open("w", encoding="utf-8", newline="\n") as output:
                output.write(json.dumps(payload, ensure_ascii=False, indent=2) + "\n")
                output.flush()
                os.fsync(output.fileno())
            temporary.replace(path)
            self._fsync_directory(path.parent)
        finally:
            temporary.unlink(missing_ok=True)

    @staticmethod
    def _fsync_directory(directory: Path) -> None:
        flags = os.O_RDONLY | getattr(os, "O_DIRECTORY", 0)
        try:
            descriptor = os.open(directory, flags)
        except OSError:
            return
        try:
            os.fsync(descriptor)
        finally:
            os.close(descriptor)

    def _append_history(
        self,
        record: VoicePresetApprovalRecord,
        before: dict[str, object],
        after: dict[str, object],
    ) -> None:
        value = {
            "record": record.model_dump(mode="json"),
            "before_manifest": before,
            "after_manifest": after,
        }
        with self.history_path.open("a", encoding="utf-8", newline="\n") as output:
            output.write(
                json.dumps(value, ensure_ascii=False, separators=(",", ":")) + "\n"
            )
            output.flush()
            os.fsync(output.fileno())

    def _read_history(self) -> list[dict[str, object]]:
        if not self.history_path.is_file():
            return []
        results: list[dict[str, object]] = []
        for line in self.history_path.read_text(encoding="utf-8").splitlines():
            try:
                value = json.loads(line)
            except json.JSONDecodeError:
                continue
            if isinstance(value, dict):
                results.append(value)
        return results
