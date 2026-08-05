import pytest
from starlette.requests import Request

from app.core.config import Settings
from app.services.voice_review_operator import (
    VoiceReviewOperatorAuthorizationError,
    authorize_voice_review_operator,
)


def _request(host: str, headers: dict[str, str] | None = None) -> Request:
    raw_headers = [
        (key.lower().encode("latin-1"), value.encode("latin-1"))
        for key, value in (headers or {}).items()
    ]
    return Request(
        {
            "type": "http",
            "method": "POST",
            "scheme": "http",
            "path": "/api/v1/quality/voice-preset-approvals/apply",
            "raw_path": b"/api/v1/quality/voice-preset-approvals/apply",
            "query_string": b"",
            "headers": raw_headers,
            "client": (host, 50000),
            "server": ("127.0.0.1", 8000),
        }
    )


def test_loopback_operator_is_allowed_without_token():
    principal = authorize_voice_review_operator(_request("127.0.0.1"), Settings())

    assert principal.auth_mode == "loopback"
    assert "ip:127.0.0.1" in principal.actor


def test_loopback_bypass_is_not_broken_by_a_stale_browser_token():
    principal = authorize_voice_review_operator(
        _request(
            "127.0.0.1",
            {"X-SoriON-Operator-Token": "stale-session-token"},
        ),
        Settings(),
    )

    assert principal.auth_mode == "loopback"


def test_remote_operator_is_denied_when_server_token_is_missing():
    with pytest.raises(VoiceReviewOperatorAuthorizationError) as captured:
        authorize_voice_review_operator(_request("192.168.0.20"), Settings())

    assert captured.value.status_code == 403
    assert captured.value.code == "SOA-6831"


def test_remote_operator_requires_matching_constant_time_token():
    token = "a-secure-operator-token-with-32-characters"
    settings = Settings(voice_review_operator_token=token)

    with pytest.raises(VoiceReviewOperatorAuthorizationError) as captured:
        authorize_voice_review_operator(
            _request(
                "192.168.0.20",
                {"X-SoriON-Operator-Token": "wrong-token"},
            ),
            settings,
        )

    assert captured.value.code == "SOA-6832"

    principal = authorize_voice_review_operator(
        _request(
            "192.168.0.20",
            {
                "X-SoriON-Operator-Token": token,
                "X-SoriON-Operator-ID": "reviewer-a",
            },
        ),
        settings,
    )
    assert principal.auth_mode == "operator-token"
    assert "declared-operator:reviewer-a" in principal.actor


def test_short_server_token_is_rejected_as_misconfiguration():
    settings = Settings(
        voice_review_operator_token="short-token",
        voice_review_allow_loopback_without_token=False,
    )

    with pytest.raises(VoiceReviewOperatorAuthorizationError) as captured:
        authorize_voice_review_operator(
            _request(
                "127.0.0.1",
                {"X-SoriON-Operator-Token": "short-token"},
            ),
            settings,
        )

    assert captured.value.status_code == 503
    assert captured.value.code == "SOA-6833"
