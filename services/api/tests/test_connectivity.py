from app.core.config import get_settings


def test_connectivity_reports_api_and_engine_state(client):
    response = client.get("/api/v1/connectivity")

    assert response.status_code == 200
    body = response.json()
    assert body["version"] == "0.7.0"
    assert body["api_base_path"] == "/api/v1"
    assert any(check["id"] == "api" for check in body["checks"])
    assert any(engine["id"] == "mock" for engine in body["tts_engines"])
    assert any(
        engine["id"] == "cosyvoice3-worker"
        for engine in body["voice_clone_engines"]
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
    assert python_step["label"] == "Python 3.10 이상"
    assert get_settings().cors_origin_list
