from app.security import signature_payload, verify_worker_request


def signed_headers(method: str, path: str, body: bytes, now: int = 100) -> dict[str, str]:
    import hashlib
    import hmac

    timestamp = str(now)
    payload = signature_payload(method, path, timestamp, body)
    signature = hmac.new(b"secret", payload.encode(), hashlib.sha256).hexdigest()
    return {
        "x-sorion-service-token": "token",
        "x-sorion-timestamp": timestamp,
        "x-sorion-signature": signature,
    }


def test_worker_signature_accepts_valid_request():
    result = verify_worker_request(
        "POST",
        "/v1/jobs",
        signed_headers("POST", "/v1/jobs", b"body"),
        b"body",
        "token",
        "secret",
        30,
        now=100,
    )
    assert result.ok is True


def test_worker_signature_rejects_expired_request():
    result = verify_worker_request(
        "GET",
        "/ready",
        signed_headers("GET", "/ready", b"", now=1),
        b"",
        "token",
        "secret",
        30,
        now=100,
    )
    assert result.ok is False
    assert "만료" in result.reason
