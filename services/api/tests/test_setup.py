def test_setup_status_explains_required_steps(client):
    response = client.get("/api/v1/setup")

    assert response.status_code == 200
    body = response.json()
    assert body["version"] == "0.9.3-alpha.1"
    assert isinstance(body["ready"], bool)
    assert isinstance(body["real_engine_count"], int)
    steps = {item["id"]: item for item in body["steps"]}
    assert steps["python"]["required"] is True
    assert steps["audio-directory"]["status"] == "ready"
    assert "real-engine" in steps
    assert "ffmpeg" in steps
