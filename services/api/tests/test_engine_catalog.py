def test_engine_catalog_curates_free_korean_orchestrator(client):
    response = client.get("/api/v1/engines/catalog")

    assert response.status_code == 200
    body = response.json()
    assert body["version"] == "0.11.22"
    assert body["free_only"] is True
    assert body["product_identity"] == "engine-orchestrator"

    items = {item["id"]: item for item in body["items"]}
    assert items["cosyvoice3"]["decision"] == "adopted"
    assert items["cosyvoice3"]["auto_eligible"] is True
    assert items["melo"]["license_policy"] == "permissive"
    assert items["f5-tts"]["decision"] == "research-only"
    assert items["f5-tts"]["auto_eligible"] is False
    assert items["kokoro"]["decision"] == "excluded"
    assert items["openvoice-v2"]["decision"] == "optional"
    assert items["seed-vc"]["decision"] == "external-plugin"
    assert items["deepfilternet3"]["decision"] == "adopted"

    auto_ids = {
        item["id"]
        for item in body["items"]
        if item["auto_eligible"]
    }
    assert "f5-tts" not in auto_ids
    assert "seed-vc" not in auto_ids
    assert "cosyvoice3" in auto_ids


def test_catalog_pipeline_keeps_engine_choice_internal(client):
    body = client.get("/api/v1/engines/catalog").json()
    stages = {stage["id"]: stage for stage in body["pipeline"]}

    assert stages["director"]["required"] is True
    assert stages["tts"]["default_engine_ids"] == [
        "cosyvoice3",
        "melo",
        "system",
    ]
    assert stages["verification"]["default_engine_ids"] == ["faster-whisper"]
