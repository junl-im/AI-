from __future__ import annotations

import json
from collections.abc import Mapping
from dataclasses import dataclass
from types import MappingProxyType


class VoiceReviewTrustConfigurationError(ValueError):
    pass


def parse_trusted_keys_json(value: str) -> dict[str, str]:
    normalized = value.strip()
    if not normalized:
        return {}
    try:
        payload = json.loads(normalized)
    except json.JSONDecodeError as error:
        raise VoiceReviewTrustConfigurationError(
            "SORION_VOICE_REVIEW_TRUSTED_KEYS_JSON은 JSON 객체여야 합니다."
        ) from error
    if not isinstance(payload, dict):
        raise VoiceReviewTrustConfigurationError(
            "SORION_VOICE_REVIEW_TRUSTED_KEYS_JSON 최상위 값은 객체여야 합니다."
        )
    keys: dict[str, str] = {}
    for raw_key_id, raw_secret in payload.items():
        if not isinstance(raw_key_id, str) or not raw_key_id.strip():
            raise VoiceReviewTrustConfigurationError(
                "신뢰 키 ID는 비어 있지 않은 문자열이어야 합니다."
            )
        if not isinstance(raw_secret, str) or not raw_secret:
            raise VoiceReviewTrustConfigurationError(
                f"신뢰 키 {raw_key_id!r}의 secret은 비어 있지 않은 문자열이어야 합니다."
            )
        key_id = raw_key_id.strip()
        if len(key_id) > 120:
            raise VoiceReviewTrustConfigurationError("신뢰 키 ID는 120자를 넘을 수 없습니다.")
        if key_id in keys:
            raise VoiceReviewTrustConfigurationError(
                f"공백 정규화 뒤 중복되는 신뢰 키 ID가 있습니다: {key_id!r}"
            )
        keys[key_id] = raw_secret
    return keys


@dataclass(frozen=True)
class VoiceReviewTrustStore:
    active_key_id: str
    _secrets: Mapping[str, bytes]

    @classmethod
    def build(
        cls,
        *,
        active_secret: str = "",
        active_key_id: str = "local-review-key",
        trusted_keys: Mapping[str, str] | None = None,
    ) -> VoiceReviewTrustStore:
        normalized_active_id = active_key_id.strip() or "local-review-key"
        secrets: dict[str, bytes] = {
            key_id.strip(): secret.encode("utf-8")
            for key_id, secret in (trusted_keys or {}).items()
            if key_id.strip() and secret
        }
        if active_secret:
            secrets[normalized_active_id] = active_secret.encode("utf-8")
        return cls(
            active_key_id=normalized_active_id,
            _secrets=MappingProxyType(secrets),
        )

    @property
    def can_sign(self) -> bool:
        return self.active_key_id in self._secrets

    @property
    def trusted_key_ids(self) -> tuple[str, ...]:
        return tuple(sorted(self._secrets))

    def secret_for(self, key_id: str | None) -> bytes | None:
        if not key_id:
            return None
        return self._secrets.get(key_id.strip())

    def active_secret(self) -> bytes | None:
        return self.secret_for(self.active_key_id)

    def role_for(self, key_id: str | None) -> str:
        normalized = key_id.strip() if key_id else ""
        if not normalized or normalized not in self._secrets:
            return "untrusted"
        return "active" if normalized == self.active_key_id else "previous"
