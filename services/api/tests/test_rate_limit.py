from starlette.requests import Request

from app.main import client_key
from app.services.rate_limit import FixedWindowRateLimiter


def test_rate_limiter_blocks_after_limit_and_recovers():
    limiter = FixedWindowRateLimiter(limit=2, window_seconds=10)
    assert limiter.check("user", now=0)[0] is True
    assert limiter.check("user", now=1)[0] is True
    assert limiter.check("user", now=2)[0] is False
    assert limiter.check("user", now=11)[0] is True


def test_public_client_id_does_not_create_a_new_rate_limit_bucket():
    def request(client_id: str) -> Request:
        return Request(
            {
                "type": "http",
                "http_version": "1.1",
                "method": "GET",
                "scheme": "https",
                "path": "/api/v1/tts/jobs/test",
                "raw_path": b"/api/v1/tts/jobs/test",
                "query_string": b"",
                "headers": [(b"x-sorion-client-id", client_id.encode("utf-8"))],
                "client": ("198.51.100.20", 50000),
                "server": ("voice.example.com", 443),
                "app": type(
                    "App",
                    (),
                    {
                        "state": type(
                            "State",
                            (),
                            {"settings": type(
                                "Settings",
                                (),
                                {"trusted_proxy_cidr_list": []},
                            )()},
                        )(),
                    },
                )(),
            }
        )

    assert client_key(request("client-a")) == client_key(request("client-b"))
