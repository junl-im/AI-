def test_engine_strategy_is_free_only_local_runtime(client):
    response = client.get("/api/v1/engines/strategy")

    assert response.status_code == 200
    body = response.json()
    assert body["version"] == "0.11.12"
    assert body["free_only"] is True
    assert body["deployment_profile"] == "firebase-static-plus-local-runtime"
    assert body["primary_tts_engine"] == "auto"
    assert body["primary_clone_engine"] == "cosyvoice3"
    assert body["browser_fallback_engine"] == "browser-speech"
    assert body["auto_order"] == ["cosyvoice3", "melo", "system", "mock"]

    candidates = {item["id"]: item for item in body["candidates"]}
    assert set(candidates) == {"cosyvoice3", "melo", "system", "mock"}
    assert "ko-KR" in candidates["cosyvoice3"]["languages"]
    assert "zero-shot-voice-clone" in candidates["cosyvoice3"]["capabilities"]
    assert candidates["cosyvoice3"]["runtime"] == "local-worker"
    assert candidates["melo"]["runtime"] == "local-process"
    assert candidates["system"]["runtime"] == "device"
    assert candidates["mock"]["role"] == "test-only"
