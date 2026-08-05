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
