def test_engine_strategy_selects_korean_first_primary(client):
    response = client.get("/api/v1/engines/strategy")

    assert response.status_code == 200
    body = response.json()
    assert body["version"] == "0.6.4"
    assert body["primary_tts_engine"] == "cosyvoice3"
    assert body["primary_clone_engine"] == "cosyvoice3"

    candidates = {item["id"]: item for item in body["candidates"]}
    assert "ko-KR" in candidates["cosyvoice3"]["languages"]
    assert "zero-shot-voice-clone" in candidates["cosyvoice3"]["capabilities"]
    assert candidates["fish-speech-s2"]["role"] == "evaluation-only"
