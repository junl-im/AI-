from fastapi.testclient import TestClient

from app.core.config import get_settings
from app.main import app


def _configure_paths(monkeypatch, tmp_path) -> None:
    monkeypatch.setenv("SORION_JOB_STORE_PATH", str(tmp_path / "jobs.sqlite3"))
    monkeypatch.setenv("SORION_AUDIO_DIRECTORY", str(tmp_path / "audio"))
    monkeypatch.setenv("SORION_VOICE_CLONE_DIRECTORY", str(tmp_path / "voice-clones"))
    monkeypatch.setenv("SORION_AUDIT_LOG_PATH", str(tmp_path / "audit.jsonl"))
    monkeypatch.setenv(
        "SORION_DEVICE_BENCHMARK_PATH",
        str(tmp_path / "device-benchmarks.jsonl"),
    )
    monkeypatch.setenv("SORION_STT_DIRECTORY", str(tmp_path / "stt"))
    monkeypatch.setenv(
        "SORION_STT_COMPARISON_PATH",
        str(tmp_path / "stt-comparisons.jsonl"),
    )
    monkeypatch.setenv("SORION_EXPORT_SOAK_PATH", str(tmp_path / "export-soak.jsonl"))
    monkeypatch.setenv(
        "SORION_EVIDENCE_INTAKE_PATH",
        str(tmp_path / "imported-evidence.jsonl"),
    )
    monkeypatch.setenv(
        "SORION_WORKER_TELEMETRY_PATH",
        str(tmp_path / "worker-telemetry.jsonl"),
    )
    monkeypatch.setenv(
        "SORION_VOICE_REVIEW_APPROVAL_PATH",
        str(tmp_path / "voice-review-approvals.jsonl"),
    )


def test_loopback_can_read_approval_history_without_operator_token(client):
    response = client.get("/api/v1/quality/voice-preset-approvals/history")

    assert response.status_code == 200
    assert response.json() == []


def test_remote_approval_history_requires_matching_operator_token(
    monkeypatch,
    tmp_path,
):
    _configure_paths(monkeypatch, tmp_path)
    token = "remote-review-token-that-is-longer-than-32-characters"
    monkeypatch.setenv("SORION_VOICE_REVIEW_OPERATOR_TOKEN", token)
    get_settings.cache_clear()
    try:
        with TestClient(app, client=("192.168.0.20", 50000)) as remote_client:
            denied = remote_client.get(
                "/api/v1/quality/voice-preset-approvals/history"
            )
            allowed = remote_client.get(
                "/api/v1/quality/voice-preset-approvals/history",
                headers={"X-SoriON-Operator-Token": token},
            )
    finally:
        get_settings.cache_clear()

    assert denied.status_code == 403
    assert "SOA-6832" in denied.json()["detail"]
    assert allowed.status_code == 200
    assert allowed.json() == []


def test_renewal_route_is_static_and_returns_domain_error_without_preset_directory(client):
    response = client.get("/api/v1/quality/voice-preset-approvals/renewals")

    assert response.status_code == 409
    assert "SOA-6810" in response.json()["detail"]
    assert "프리셋 폴더" in response.json()["detail"]


def test_resign_preview_route_reaches_domain_validation(client):
    response = client.post(
        "/api/v1/quality/voice-preset-approvals/resign/preview",
        json={"voice_id": "not-a-preset", "expected_manifest_sha256": None},
    )

    assert response.status_code == 409
    assert "지원하지 않는 프리셋 ID" in response.json()["detail"]
