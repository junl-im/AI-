from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.core.config import get_settings
from app.middleware.private_network_cors import PrivateNetworkCORSMiddleware


def test_connectivity_reports_api_and_engine_state(client):
    response = client.get("/api/v1/connectivity")

    assert response.status_code == 200
    body = response.json()
    assert body["version"] == "0.11.31"
    assert body["api_base_path"] == "/api/v1"
    assert body["api_ready"] is True
    assert isinstance(body["tts_ready"], bool)
    assert isinstance(body["public_https_ready"], bool)
    assert any(check["id"] == "public-https-bridge" for check in body["checks"])
    assert isinstance(body["voice_clone_ready"], bool)
    assert isinstance(body["worker_configured"], bool)
    assert any(check["id"] == "api" for check in body["checks"])
    assert any(engine["id"] == "mock" for engine in body["tts_engines"])
    assert any(
        engine["id"] == "cosyvoice3-worker"
        for engine in body["voice_clone_engines"]
    )


def test_connectivity_uses_the_same_recommended_engine_as_catalog(client):
    connectivity = client.get("/api/v1/connectivity")
    catalog = client.get("/api/v1/engines")

    assert connectivity.status_code == 200
    assert catalog.status_code == 200
    connectivity_engines = connectivity.json()["tts_engines"]
    catalog_engines = catalog.json()
    assert [item["id"] for item in connectivity_engines if item["recommended"]] == [
        item["id"] for item in catalog_engines if item["recommended"]
    ]
    assert all(
        item["health"] in {"ready", "cooldown", "unavailable"}
        for item in connectivity_engines
    )


def test_default_cors_allows_github_pages(client):
    response = client.options(
        "/api/v1/health",
        headers={
            "Origin": "https://junl-im.github.io",
            "Access-Control-Request-Method": "GET",
        },
    )

    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == "https://junl-im.github.io"


def test_python_310_is_the_documented_minimum(client):
    response = client.get("/api/v1/setup")

    assert response.status_code == 200
    python_step = next(
        item for item in response.json()["steps"] if item["id"] == "python"
    )
    assert python_step["label"] == "Python 3.10 이상 · 지원 상한 3.12"
    assert get_settings().cors_origin_list


def test_connectivity_exposes_mobile_engine_layers(client):
    response = client.get(
        "/api/v1/connectivity",
        headers={"X-Request-ID": "mobile-engine-check"},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["request_id"] == "mobile-engine-check"
    assert isinstance(body["worker_healthy"], bool)
    assert isinstance(body["gpu_ready"], bool)
    assert body["recommended_recheck_seconds"] >= 1
    assert any(check["id"] == "worker-gpu" for check in body["checks"])
    assert any(
        check["id"] == "worker-model-integrity" for check in body["checks"]
    )
    assert any(check["id"] == "private-network" for check in body["checks"])
    assert any(check["id"] == "stt-engine" for check in body["checks"])
    assert any(check["id"] == "ffmpeg-export" for check in body["checks"])


def test_private_network_preflight_is_allowed_in_development(client):
    response = client.options(
        "/api/v1/health",
        headers={
            "Origin": "https://junl-im.github.io",
            "Access-Control-Request-Method": "GET",
            "Access-Control-Request-Private-Network": "true",
        },
    )

    assert response.status_code == 200
    assert response.headers["access-control-allow-private-network"] == "true"


def test_private_network_preflight_keeps_standard_cors_restrictions(client):
    response = client.options(
        "/api/v1/health",
        headers={
            "Origin": "https://invalid.example",
            "Access-Control-Request-Method": "GET",
            "Access-Control-Request-Private-Network": "true",
        },
    )

    assert response.status_code == 400
    assert "access-control-allow-private-network" not in response.headers


def test_private_network_preflight_is_rejected_when_disabled():
    test_app = FastAPI()
    test_app.add_middleware(
        PrivateNetworkCORSMiddleware,
        allow_origins=["https://junl-im.github.io"],
        allow_methods=["GET"],
        allow_headers=["*"],
        allow_private_network=False,
    )

    with TestClient(test_app) as test_client:
        response = test_client.options(
            "/api/v1/health",
            headers={
                "Origin": "https://junl-im.github.io",
                "Access-Control-Request-Method": "GET",
                "Access-Control-Request-Private-Network": "true",
            },
        )

    assert response.status_code == 400
    assert "access-control-allow-private-network" not in response.headers


def test_connectivity_recognizes_forwarded_public_https_bridge(client):
    response = client.get(
        "/api/v1/connectivity",
        headers={
            "X-Forwarded-Proto": "https",
            "X-Forwarded-Host": "voice.example.com",
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["public_https_ready"] is True
    assert body["public_api_origin"] == "https://voice.example.com"
    bridge = next(item for item in body["checks"] if item["id"] == "public-https-bridge")
    assert bridge["status"] == "ready"


def test_connectivity_does_not_mark_private_dns_as_public_bridge(client):
    response = client.get(
        "/api/v1/connectivity",
        headers={
            "X-Forwarded-Proto": "https",
            "X-Forwarded-Host": "voice.sorion.local",
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["public_https_ready"] is False
    assert body["public_api_origin"] is None
    bridge = next(item for item in body["checks"] if item["id"] == "public-https-bridge")
    assert bridge["status"] == "warning"


def test_connectivity_requires_tls_for_public_bridge(client):
    response = client.get(
        "/api/v1/connectivity",
        headers={
            "X-Forwarded-Proto": "http",
            "X-Forwarded-Host": "voice.example.com",
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["public_https_ready"] is False
    assert body["public_api_origin"] == "http://voice.example.com"
    bridge = next(item for item in body["checks"] if item["id"] == "public-https-bridge")
    assert bridge["status"] == "missing"

