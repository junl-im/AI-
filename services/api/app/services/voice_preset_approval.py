from __future__ import annotations

import hashlib
import hmac
import json
import os
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
)
from app.schemas.voice_preset_evidence import (
    VoiceApprovalSignatureRecord,
    VoiceHumanReviewRecord,
    VoicePresetManifest,
)
from app.services.voice_preset_evidence import (
    inspect_voice_preset_evidence,
    mark_duplicate_checksums,
    sha256_file,
)
from app.services.voice_preset_validation import inspect_voice_preset
from app.services.voice_presets import PRESET_VOICE_IDS, get_voice_preset

_CONFIRM_APPROVAL = "현재 WAV 승인"
_CONFIRM_ROLLBACK = "승인 롤백"


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


@dataclass(frozen=True)
class _PreparedApproval:
    response: VoicePresetApprovalPreviewResponse
    current_manifest: dict[str, object]
    proposed_manifest: dict[str, object]


class VoicePresetApprovalService:
    def __init__(
        self,
        preset_directory: Path | None,
        history_path: Path,
        signing_secret: str = "",
        signing_key_id: str = "local-review-key",
    ) -> None:
        self.preset_directory = preset_directory
        self.history_path = history_path
        self.history_path.parent.mkdir(parents=True, exist_ok=True)
        self.signing_secret = signing_secret.encode("utf-8") if signing_secret else b""
        self.signing_key_id = signing_key_id.strip() or "local-review-key"
        self._lock = Lock()

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
            inspections.append(inspect_voice_preset_evidence(directory, profile, audio))
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

        manifest_path, current = self._load_manifest(payload.voice_id)
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
        signature_mode = "hmac-sha256" if self.signing_secret else "unsigned"
        proposed.approval = VoiceApprovalSignatureRecord(
            mode=signature_mode,
            key_id=self.signing_key_id if self.signing_secret else "",
            signed_at=reviewed_at,
            signed_payload_sha256="",
            signature="",
        )
        proposed_dict = proposed.model_dump(mode="json")
        signature_payload = _signature_payload(proposed_dict)
        signed_payload_sha256 = _manifest_digest(signature_payload)
        proposed_dict["approval"]["signed_payload_sha256"] = signed_payload_sha256
        if self.signing_secret:
            proposed_dict["approval"]["signature"] = hmac.new(
                self.signing_secret,
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
            signing_key_id=self.signing_key_id if self.signing_secret else None,
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
            raise VoicePresetApprovalError(f"확인 문구는 '{_CONFIRM_APPROVAL}'이어야 합니다.")
        prepared = self._prepare(VoicePresetApprovalInput.model_validate(payload.model_dump()))
        if prepared.response.preview_id != payload.preview_id:
            raise VoicePresetApprovalError(
                "미리보기 이후 WAV 또는 manifest 상태가 달라졌습니다. 다시 미리보기 하세요."
            )
        if not prepared.response.can_apply:
            raise VoicePresetApprovalError("차단 사유가 남아 있어 승인할 수 없습니다.")
        manifest_path, current = self._load_manifest(payload.voice_id)
        if _manifest_digest(current) != prepared.response.current_manifest_sha256:
            raise VoicePresetApprovalError("적용 직전 manifest가 변경되어 승인을 중단했습니다.")
        with self._lock:
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
                        prepared.proposed_manifest.get("approval", {}).get(
                            "signature"
                        )
                        or ""
                    )
                    or None
                ),
            )
            self._append_history(record, prepared.current_manifest, prepared.proposed_manifest)
        return record, prepared.proposed_manifest

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
            raise VoicePresetApprovalError(f"확인 문구는 '{_CONFIRM_ROLLBACK}'이어야 합니다.")
        source = next(
            (
                item
                for item in reversed(self._read_history())
                if item.get("record", {}).get("approval_id") == approval_id
                and item.get("record", {}).get("event") == "approved"
            ),
            None,
        )
        if source is None:
            raise VoicePresetApprovalError("롤백할 승인 기록을 찾지 못했습니다.")
        record = VoicePresetApprovalRecord.model_validate(source["record"])
        before = source.get("before_manifest")
        after = source.get("after_manifest")
        if not isinstance(before, dict) or not isinstance(after, dict):
            raise VoicePresetApprovalError("승인 기록에 복원 가능한 manifest snapshot이 없습니다.")
        manifest_path, current = self._load_manifest(record.voice_id)
        current_digest = _manifest_digest(current)
        if current_digest != record.after_manifest_sha256:
            raise VoicePresetApprovalError(
                "승인 이후 manifest가 변경되었습니다. 최신 변경을 자동 덮어쓰지 않습니다."
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
        with self._lock:
            self._atomic_write(manifest_path, rollback_manifest)
            self._append_history(rollback_record, current, rollback_manifest)
        return rollback_record, rollback_manifest

    def _atomic_write(self, path: Path, payload: dict[str, object]) -> None:
        temporary = path.with_name(f".{path.name}.{os.getpid()}.tmp")
        temporary.write_text(
            json.dumps(payload, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )
        temporary.replace(path)

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
        with self.history_path.open("a", encoding="utf-8") as output:
            output.write(json.dumps(value, ensure_ascii=False, separators=(",", ":")) + "\n")

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
