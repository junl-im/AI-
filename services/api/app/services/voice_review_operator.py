from __future__ import annotations

import hmac
import ipaddress
from dataclasses import dataclass

from fastapi import Request

from app.core.config import Settings
from app.services.proxy_headers import client_address

_OPERATOR_TOKEN_HEADER = "X-SoriON-Operator-Token"
_OPERATOR_ID_HEADER = "X-SoriON-Operator-ID"
_MIN_OPERATOR_TOKEN_LENGTH = 32


@dataclass(frozen=True)
class VoiceReviewOperatorPrincipal:
    actor: str
    auth_mode: str
    client_address: str


class VoiceReviewOperatorAuthorizationError(PermissionError):
    def __init__(self, status_code: int, code: str, message: str) -> None:
        super().__init__(message)
        self.status_code = status_code
        self.code = code


def _is_loopback(value: str) -> bool:
    try:
        return ipaddress.ip_address(value).is_loopback
    except ValueError:
        return False


def _declared_operator(request: Request) -> str:
    for header in (
        _OPERATOR_ID_HEADER,
        "X-SoriON-User-ID",
        "X-SoriON-Client-ID",
    ):
        value = request.headers.get(header, "").strip()
        if value:
            return value[:80]
    return "anonymous"


def authorize_voice_review_operator(
    request: Request,
    settings: Settings,
) -> VoiceReviewOperatorPrincipal:
    address = client_address(request, settings.trusted_proxy_cidr_list)
    configured_token = settings.voice_review_operator_token.strip()
    supplied_token = request.headers.get(_OPERATOR_TOKEN_HEADER, "").strip()
    loopback_allowed = (
        _is_loopback(address)
        and settings.voice_review_allow_loopback_without_token
    )

    if loopback_allowed:
        auth_mode = "loopback"
    else:
        if not configured_token:
            raise VoiceReviewOperatorAuthorizationError(
                403,
                "SOA-6831",
                "원격 검수 승인이 비활성화되어 있습니다. "
                "SORION_VOICE_REVIEW_OPERATOR_TOKEN을 설정하세요.",
            )
        if len(configured_token) < _MIN_OPERATOR_TOKEN_LENGTH:
            raise VoiceReviewOperatorAuthorizationError(
                503,
                "SOA-6833",
                "서버 운영자 토큰은 32자 이상이어야 합니다.",
            )
        if not supplied_token or not hmac.compare_digest(
            supplied_token.encode("utf-8"),
            configured_token.encode("utf-8"),
        ):
            raise VoiceReviewOperatorAuthorizationError(
                403,
                "SOA-6832",
                "운영자 토큰이 없거나 일치하지 않습니다.",
            )
        auth_mode = "operator-token"

    declared = _declared_operator(request)
    return VoiceReviewOperatorPrincipal(
        actor=f"auth:{auth_mode};ip:{address};declared-operator:{declared}",
        auth_mode=auth_mode,
        client_address=address,
    )
