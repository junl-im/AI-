def test_engine_strategy_selects_automatic_korean_engine_mesh(client):
    response = client.get("/api/v1/engines/strategy")

    assert response.status_code == 200
    body = response.json()
    assert body["version"] == "0.8.9"
    assert body["primary_tts_engine"] == "auto"
    assert body["primary_clone_engine"] == "cosyvoice3"

    candidates = {item["id"]: item for item in body["candidates"]}
    assert "ko-KR" in candidates["cosyvoice3"]["languages"]
    assert "zero-shot-voice-clone" in candidates["cosyvoice3"]["capabilities"]
    assert candidates["naver-clova"]["status"] == "integrated"
    assert candidates["google-chirp3-hd"]["status"] == "integrated"
    assert candidates["azure-speech"]["status"] == "integrated"
    assert candidates["elevenlabs-v3"]["status"] == "integrated"
