import hashlib
import hmac
import time
from collections.abc import Mapping
from dataclasses import dataclass


@dataclass(frozen=True)
class AuthResult:
    ok: bool
    reason: str


def signature_payload(method: str, path: str, timestamp: str, body: bytes) -> str:
    body_hash = hashlib.sha256(body).hexdigest()
    return "\n".join((method.upper(), path, timestamp, body_hash))


def verify_worker_request(
    method: str,
    path: str,
    headers: Mapping[str, str],
    body: bytes,
    service_token: str,
    signature_secret: str,
    ttl_seconds: int,
    now: int | None = None,
) -> AuthResult:
    if not service_token or not signature_secret:
        return AuthResult(True, "development-auth-disabled")
    token = headers.get("x-sorion-service-token", "")
    timestamp = headers.get("x-sorion-timestamp", "")
    signature = headers.get("x-sorion-signature", "")
    if not token or not timestamp or not signature:
        return AuthResult(False, "SOA-W7001: Worker 인증 헤더가 필요합니다.")
    if not hmac.compare_digest(token, service_token):
        return AuthResult(False, "SOA-W7002: Worker 서비스 토큰이 올바르지 않습니다.")
    try:
        issued_at = int(timestamp)
    except ValueError:
        return AuthResult(False, "SOA-W7003: Worker 인증 시간이 올바르지 않습니다.")
    current = now if now is not None else int(time.time())
    if abs(current - issued_at) > ttl_seconds:
        return AuthResult(False, "SOA-W7004: Worker 인증 요청이 만료되었습니다.")
    payload = signature_payload(method, path, timestamp, body)
    expected = hmac.new(
        signature_secret.encode(),
        payload.encode(),
        hashlib.sha256,
    ).hexdigest()
    if not hmac.compare_digest(signature, expected):
        return AuthResult(False, "SOA-W7005: Worker 요청 서명이 올바르지 않습니다.")
    return AuthResult(True, "authenticated")
