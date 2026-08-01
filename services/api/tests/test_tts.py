import time
from uuid import uuid4

from fastapi.testclient import TestClient

from app.core.config import get_settings
from app.main import app


def test_mock_tts_validates_contract(client):
    job_id = str(uuid4())
    response = client.post(
        "/api/v1/tts/synthesize",
        json={
            "text": "안녕하세요. 소리온입니다.",
            "voice_id": "sori-warm",
            "emotion": "calm",
            "speed": 1.0,
            "pitch": 0,
            "output_format": "wav",
            "engine_id": "mock",
            "job_id": job_id,
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["job_id"] == job_id
    assert body["status"] == "mock-complete"
    assert body["engine_id"] == "mock"
    assert body["engine_mode"] == "mock"
    assert body["audio_url"] is None
    assert body["estimated_duration_seconds"] >= 1


def test_tts_rejects_empty_text(client):
    response = client.post(
        "/api/v1/tts/synthesize",
        json={"text": "", "voice_id": "sori-warm"},
    )

    assert response.status_code == 422


def test_unknown_engine_is_rejected(client):
    response = client.post(
        "/api/v1/tts/synthesize",
        json={"text": "안녕하세요", "voice_id": "sori-warm", "engine_id": "missing"},
    )

    assert response.status_code == 503
    assert "SOA-4001" in response.json()["detail"]


def test_cancel_unknown_job_is_safe(client):
    response = client.delete(f"/api/v1/tts/jobs/{uuid4()}")

    assert response.status_code == 200
    assert response.json()["cancelled"] is False


def test_completed_job_progress_can_be_read(client):
    job_id = str(uuid4())
    response = client.post(
        "/api/v1/tts/synthesize",
        json={
            "text": "작업 진행률을 확인합니다.",
            "voice_id": "sori-warm",
            "engine_id": "mock",
            "job_id": job_id,
        },
    )
    assert response.status_code == 200

    progress = client.get(f"/api/v1/tts/jobs/{job_id}")
    assert progress.status_code == 200
    body = progress.json()
    assert body["job_id"] == job_id
    assert body["phase"] == "completed"
    assert body["progress"] == 100


def test_unknown_job_progress_returns_404(client):
    response = client.get(f"/api/v1/tts/jobs/{uuid4()}")
    assert response.status_code == 404
    assert "SOA-4010" in response.json()["detail"]


def test_completed_job_result_can_be_recovered(client):
    job_id = str(uuid4())
    created = client.post(
        "/api/v1/tts/synthesize",
        json={
            "text": "모바일 연결이 끊겨도 결과를 복구합니다.",
            "voice_id": "sori-warm",
            "engine_id": "mock",
            "job_id": job_id,
        },
    )
    assert created.status_code == 200

    recovered = client.get(f"/api/v1/tts/jobs/{job_id}/result")
    assert recovered.status_code == 200
    assert recovered.json()["job_id"] == job_id
    assert recovered.json()["status"] == "mock-complete"


def test_unknown_job_result_returns_404(client):
    response = client.get(f"/api/v1/tts/jobs/{uuid4()}/result")
    assert response.status_code == 404
    assert "SOA-4010" in response.json()["detail"]


def test_same_job_id_and_payload_returns_existing_result(client):
    job_id = str(uuid4())
    payload = {
        "text": "같은 모바일 작업은 한 번만 생성합니다.",
        "voice_id": "sori-warm",
        "engine_id": "mock",
        "job_id": job_id,
    }

    first = client.post("/api/v1/tts/synthesize", json=payload)
    second = client.post("/api/v1/tts/synthesize", json=payload)

    assert first.status_code == 200
    assert second.status_code == 200
    assert second.json() == first.json()


def test_same_job_id_rejects_different_payload(client):
    job_id = str(uuid4())
    first = client.post(
        "/api/v1/tts/synthesize",
        json={
            "text": "첫 번째 요청입니다.",
            "voice_id": "sori-warm",
            "engine_id": "mock",
            "job_id": job_id,
        },
    )
    second = client.post(
        "/api/v1/tts/synthesize",
        json={
            "text": "다른 문장으로 ID를 재사용합니다.",
            "voice_id": "sori-warm",
            "engine_id": "mock",
            "job_id": job_id,
        },
    )

    assert first.status_code == 200
    assert second.status_code == 409
    assert "SOA-4009" in second.json()["detail"]


def test_completed_job_result_survives_api_restart(tmp_path, monkeypatch):
    job_id = str(uuid4())
    monkeypatch.setenv(
        "SORION_JOB_STORE_PATH",
        str(tmp_path / "restart-jobs.sqlite3"),
    )
    monkeypatch.setenv("SORION_AUDIO_DIRECTORY", str(tmp_path / "audio"))
    monkeypatch.setenv("SORION_AUDIT_LOG_PATH", str(tmp_path / "audit.jsonl"))
    get_settings.cache_clear()
    try:
        with TestClient(app) as first_client:
            created = first_client.post(
                "/api/v1/tts/synthesize",
                json={
                    "text": "API가 재시작되어도 완료 결과를 복구합니다.",
                    "voice_id": "sori-warm",
                    "engine_id": "mock",
                    "job_id": job_id,
                },
            )
            assert created.status_code == 200

        get_settings.cache_clear()
        with TestClient(app) as restarted_client:
            recovered = restarted_client.get(
                f"/api/v1/tts/jobs/{job_id}/result"
            )
            assert recovered.status_code == 200
            assert recovered.json() == created.json()
    finally:
        get_settings.cache_clear()


def test_expired_completed_job_returns_410_without_regeneration(
    tmp_path,
    monkeypatch,
):
    job_id = str(uuid4())
    audit_path = tmp_path / "audit.jsonl"
    monkeypatch.setenv(
        "SORION_JOB_STORE_PATH",
        str(tmp_path / "expired-jobs.sqlite3"),
    )
    monkeypatch.setenv("SORION_AUDIO_DIRECTORY", str(tmp_path / "audio"))
    monkeypatch.setenv("SORION_AUDIT_LOG_PATH", str(audit_path))
    monkeypatch.setenv("SORION_JOB_RESULT_TTL_MINUTES", "0")
    get_settings.cache_clear()
    payload = {
        "text": "만료된 완료 작업은 새로 합성하지 않습니다.",
        "voice_id": "sori-warm",
        "engine_id": "mock",
        "job_id": job_id,
    }
    try:
        with TestClient(app) as test_client:
            created = test_client.post("/api/v1/tts/synthesize", json=payload)
            assert created.status_code == 200
            time.sleep(0.03)

            result = test_client.get(f"/api/v1/tts/jobs/{job_id}/result")
            repeated = test_client.post("/api/v1/tts/synthesize", json=payload)

            assert result.status_code == 410
            assert repeated.status_code == 410
            assert "SOA-4012" in repeated.json()["detail"]
        assert '"event":"tts-job-result-expired"' in audit_path.read_text(
            encoding="utf-8"
        )
    finally:
        get_settings.cache_clear()
