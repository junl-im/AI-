import pytest
from fastapi.testclient import TestClient

from app.core.config import get_settings
from app.main import app


@pytest.fixture
def client(tmp_path_factory, monkeypatch):
    app_path = tmp_path_factory.mktemp("sorion-api-client")
    monkeypatch.setenv("SORION_JOB_STORE_PATH", str(app_path / "jobs.sqlite3"))
    monkeypatch.setenv("SORION_AUDIO_DIRECTORY", str(app_path / "audio"))
    monkeypatch.setenv(
        "SORION_VOICE_CLONE_DIRECTORY",
        str(app_path / "voice-clones"),
    )
    monkeypatch.setenv("SORION_AUDIT_LOG_PATH", str(app_path / "audit.jsonl"))
    monkeypatch.setenv(
        "SORION_DEVICE_BENCHMARK_PATH",
        str(app_path / "device-benchmarks.jsonl"),
    )
    monkeypatch.setenv("SORION_STT_DIRECTORY", str(app_path / "stt"))
    monkeypatch.setenv(
        "SORION_STT_COMPARISON_PATH",
        str(app_path / "stt-comparisons.jsonl"),
    )
    monkeypatch.setenv(
        "SORION_EXPORT_SOAK_PATH",
        str(app_path / "export-soak.jsonl"),
    )
    monkeypatch.setenv(
        "SORION_EVIDENCE_INTAKE_PATH",
        str(app_path / "imported-evidence.jsonl"),
    )
    monkeypatch.setenv(
        "SORION_WORKER_TELEMETRY_PATH",
        str(app_path / "worker-telemetry.jsonl"),
    )
    monkeypatch.setenv(
        "SORION_VOICE_REVIEW_APPROVAL_PATH",
        str(app_path / "voice-review-approvals.jsonl"),
    )
    get_settings.cache_clear()
    try:
        with TestClient(app, client=("127.0.0.1", 50000)) as test_client:
            yield test_client
    finally:
        get_settings.cache_clear()
