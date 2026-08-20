def test_director_builds_longform_korean_plan(client):
    response = client.post(
        "/api/v1/director/plan",
        json={
            "text": (
                "제1장. AI 기술은 빠르게 발전하고 있습니다. "
                "오늘 주문은 12건이고 결제 금액은 38,500원입니다."
            ),
            "use_case": "auto",
            "preserve_wording": True,
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["version"] == "0.11.30"
    assert body["use_case"] == "audiobook"
    assert body["recommended_speed"] == 0.94
    assert body["engine_order"] == ["cosyvoice3", "melo", "system"]
    assert "long-form" in body["required_capabilities"]
    assert len(body["segments"]) >= 1
    assert any(item["source"] == "AI" for item in body["pronunciation_hints"])
    assert any("원문 보존" in warning for warning in body["warnings"])


def test_director_detects_commercial_and_requests_emotion(client):
    response = client.post(
        "/api/v1/director/plan",
        json={
            "text": "지금 바로 특별한 혜택을 만나보세요!",
            "use_case": "auto",
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["use_case"] == "commercial"
    assert body["recommended_emotion"] == "commercial"
    assert "emotion-instruction" in body["required_capabilities"]
    assert "optional-resemble-enhance" in body["post_processing"]


def test_director_rejects_empty_text(client):
    response = client.post(
        "/api/v1/director/plan",
        json={"text": "", "use_case": "auto"},
    )

    assert response.status_code == 422
