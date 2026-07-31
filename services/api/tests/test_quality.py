
def test_quality_diagnostics_reports_runtime_and_engines(client):
    response = client.get("/api/v1/quality/diagnostics")

    assert response.status_code == 200
    body = response.json()
    assert body["version"] == "0.6.1"
    assert body["python_version"]
    assert any(engine["engine_id"] == "mock" for engine in body["engines"])


def test_quality_text_preview_returns_normalization_and_segments(client):
    response = client.post(
        "/api/v1/quality/text-preview",
        json={"text": "결제 금액은 38,500원입니다. AI 평가를 시작합니다.", "max_chars": 40},
    )

    assert response.status_code == 200
    body = response.json()
    assert "삼만 팔천오백 원" in body["normalized_text"]
    assert "에이 아이" in body["normalized_text"]
    assert body["segment_count"] >= 1


def test_quality_sentences_are_available(client):
    response = client.get("/api/v1/quality/sentences")

    assert response.status_code == 200
    body = response.json()
    assert len(body) >= 10
    assert {"id", "category", "text", "focus"}.issubset(body[0])


def test_quality_compare_handles_mock_without_audio(client):
    response = client.post(
        "/api/v1/quality/compare",
        json={"text": "안녕하세요.", "engine_ids": ["mock"]},
    )

    assert response.status_code == 200
    result = response.json()["results"][0]
    assert result["engine_id"] == "mock"
    assert result["status"] == "mock-complete"
    assert result["audio_url"] is None
