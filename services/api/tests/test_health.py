def test_health_returns_service_status(client):
    response = client.get("/api/v1/health")

    assert response.status_code == 200
    assert response.json() == {
        "status": "ok",
        "service": "sorion-api",
        "version": "0.1.0",
        "default_engine": "mock",
    }
    assert response.headers["X-Request-ID"]
