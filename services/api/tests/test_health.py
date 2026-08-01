def test_health_returns_service_status(client):
    response = client.get("/api/v1/health")

    assert response.status_code == 200
    assert response.json() == {
        "status": "ok",
        "service": "sorion-api",
        "version": "0.8.5",
        "default_engine": "auto",
    }
    assert response.headers["X-Request-ID"]


def test_engine_catalog_marks_mock_and_local_modes(client):
    response = client.get("/api/v1/engines")

    assert response.status_code == 200
    engines = {engine["id"]: engine for engine in response.json()}
    assert engines["mock"]["mode"] == "mock"
    assert engines["mock"]["ready"] is True
    if "system" in engines:
        assert engines["system"]["mode"] == "local"
        assert "reason" in engines["system"]
