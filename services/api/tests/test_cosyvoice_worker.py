import json
from pathlib import Path

import httpx
import pytest

from app.engines.voiceclone.cosyvoice_worker import CosyVoiceCloneEngine


def worker_transport(request: httpx.Request) -> httpx.Response:
    if request.url.path != "/health":
        assert request.headers.get("X-SoriON-Service-Token") == "test-token"
        assert request.headers.get("X-SoriON-Signature")
    if request.url.path == "/health":
        return httpx.Response(200, json={"status": "ok", "version": "test-worker"})
    if request.url.path == "/ready":
        return httpx.Response(
            200,
            json={
                "status": "ready",
                "diagnostics": {
                    "ready": True,
                    "reason": "준비됨",
                    "backend": "test",
                },
            },
        )
    if request.url.path == "/v1/diagnostics":
        return httpx.Response(200, json={"ready": True, "backend": "test"})
    if request.url.path == "/v1/jobs":
        return httpx.Response(202, json={"id": "job-1", "status": "queued"})
    return httpx.Response(404, json={"detail": "not found"})


@pytest.mark.asyncio
async def test_worker_probe_updates_ready_state():
    engine = CosyVoiceCloneEngine(
        "http://worker.test",
        service_token="test-token",
        signature_secret="test-secret",
        transport=httpx.MockTransport(worker_transport),
    )

    assert await engine.probe() is True
    assert engine.info().ready is True
    assert engine.probe_snapshot()["worker_version"] == "test-worker"
    assert engine.probe_snapshot()["diagnostics"]["backend"] == "test"


@pytest.mark.asyncio
async def test_worker_without_url_stays_unavailable():
    engine = CosyVoiceCloneEngine("")

    assert await engine.probe() is False
    assert engine.info().ready is False


@pytest.mark.asyncio
async def test_worker_can_create_job(tmp_path: Path):
    sample = tmp_path / "sample.wav"
    sample.write_bytes(b"sample")
    engine = CosyVoiceCloneEngine(
        "http://worker.test",
        service_token="test-token",
        signature_secret="test-secret",
        transport=httpx.MockTransport(worker_transport),
    )

    result = await engine.create_job("profile-1", "안녕하세요.", sample)

    assert result["id"] == "job-1"
    assert result["status"] == "queued"


@pytest.mark.asyncio
async def test_worker_diagnostics_are_forwarded():
    engine = CosyVoiceCloneEngine(
        "http://worker.test",
        service_token="test-token",
        signature_secret="test-secret",
        transport=httpx.MockTransport(worker_transport),
    )

    diagnostics = await engine.diagnostics()

    assert diagnostics == {"ready": True, "backend": "test"}
