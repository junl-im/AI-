from __future__ import annotations

import hashlib
import json
from datetime import datetime, timezone

from app.schemas.voice_preset_approval import VoicePresetApprovalDiff


def canonical_json(value: object) -> bytes:
    return json.dumps(
        value,
        ensure_ascii=False,
        sort_keys=True,
        separators=(",", ":"),
    ).encode("utf-8")


def sha256_bytes(value: bytes) -> str:
    return hashlib.sha256(value).hexdigest()


def valid_sha256(value: str) -> bool:
    return len(value) == 64 and all(
        character in "0123456789abcdef" for character in value
    )


def manifest_digest(payload: dict[str, object]) -> str:
    return sha256_bytes(canonical_json(payload))


def signature_payload(payload: dict[str, object]) -> dict[str, object]:
    value = json.loads(json.dumps(payload, ensure_ascii=False))
    approval = value.get("approval")
    if isinstance(approval, dict):
        approval["signature"] = ""
        approval["signed_payload_sha256"] = ""
    return value


def manifest_diff(
    before: object,
    after: object,
    path: str = "",
) -> list[VoicePresetApprovalDiff]:
    if isinstance(before, dict) and isinstance(after, dict):
        rows: list[VoicePresetApprovalDiff] = []
        for key in sorted(set(before) | set(after)):
            child = f"{path}.{key}" if path else key
            rows.extend(manifest_diff(before.get(key), after.get(key), child))
        return rows
    if before != after:
        return [VoicePresetApprovalDiff(path=path, before=before, after=after)]
    return []


def normalized_datetime(value: datetime | None) -> datetime | None:
    if value is None:
        return None
    return value if value.tzinfo is not None else value.replace(tzinfo=timezone.utc)


def days_remaining(value: datetime | None, now: datetime) -> int | None:
    normalized = normalized_datetime(value)
    if normalized is None:
        return None
    return int((normalized - now).total_seconds() // 86400)
