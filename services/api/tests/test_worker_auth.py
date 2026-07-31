from app.services.worker_auth import build_worker_auth_headers


def test_worker_auth_headers_are_deterministic():
    headers = build_worker_auth_headers(
        "POST",
        "/v1/jobs",
        b"body",
        "token",
        "secret",
        now=100,
    )
    assert headers["X-SoriON-Service-Token"] == "token"
    assert headers["X-SoriON-Timestamp"] == "100"
    assert len(headers["X-SoriON-Signature"]) == 64


def test_worker_auth_can_be_disabled_for_local_development():
    assert build_worker_auth_headers("GET", "/ready", b"", "", "") == {}
