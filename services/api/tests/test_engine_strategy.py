def test_engine_strategy_defaults_to_free_only_korean_engine_mesh(client):
    response = client.get("/api/v1/engines/strategy")

    assert response.status_code == 200
    body = response.json()
    assert body["version"] == "0.9.0"
    assert body["cost_policy"] == "free-only"
    assert body["metered_engines_enabled"] is False
    assert body["primary_tts_engine"] == "auto"
    assert body["primary_clone_engine"] == "cosyvoice3"
    assert body["auto_order"] == ["cosyvoice3", "melo", "system", "mock"]

    candidates = {item["id"]: item for item in body["candidates"]}
    assert "ko-KR" in candidates["cosyvoice3"]["languages"]
    assert "zero-shot-voice-clone" in candidates["cosyvoice3"]["capabilities"]
    assert candidates["cosyvoice3"]["cost_tier"] == "free"
    assert candidates["melo"]["enabled_by_default"] is True
    assert candidates["naver-clova"]["status"] == "optional"
    assert candidates["naver-clova"]["cost_tier"] == "metered"
    assert candidates["google-chirp3-hd"]["enabled_by_default"] is False
    assert candidates["azure-speech"]["enabled_by_default"] is False
    assert candidates["elevenlabs-v3"]["enabled_by_default"] is False
