from fastapi import FastAPI
from starlette.datastructures import Headers
from starlette.middleware.cors import CORSMiddleware
from starlette.responses import PlainTextResponse

from app.middleware.private_network_cors import PrivateNetworkCORSMiddleware


def test_pna_header_is_removed_before_standard_cors_validation(monkeypatch):
    captured = {}

    def fake_preflight_response(_middleware, request_headers):
        captured["private_network"] = request_headers.get(
            "Access-Control-Request-Private-Network"
        )
        return PlainTextResponse("OK", status_code=200)

    monkeypatch.setattr(CORSMiddleware, "preflight_response", fake_preflight_response)
    middleware = PrivateNetworkCORSMiddleware(
        FastAPI(),
        allow_origins=["https://junl-im.github.io"],
        allow_methods=["GET"],
        allow_headers=["*"],
        allow_private_network=True,
    )
    response = middleware.preflight_response(
        Headers(
            {
                "Origin": "https://junl-im.github.io",
                "Access-Control-Request-Method": "GET",
                "Access-Control-Request-Private-Network": "true",
            }
        )
    )

    assert captured["private_network"] is None
    assert response.headers["access-control-allow-private-network"] == "true"
