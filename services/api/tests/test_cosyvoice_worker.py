import json
import pytest

from app.engines.voiceclone import cosyvoice_worker
from app.engines.voiceclone.cosyvoice_worker import CosyVoiceCloneEngine


class FakeResponse:
    status = 200

    def __enter__(self):
        return self

    def __exit__(self, *_args):
        return None

    def read(self, _limit):
        return json.dumps({"status": "ready", "version": "test-worker"}).encode()


@pytest.mark.asyncio
async def test_worker_probe_updates_ready_state(monkeypatch):
    monkeypatch.setattr(cosyvoice_worker, "urlopen", lambda *_args, **_kwargs: FakeResponse())
    engine = CosyVoiceCloneEngine("http://127.0.0.1:9000")

    assert await engine.probe() is True
    assert engine.info().ready is True
    assert engine.probe_snapshot()["worker_version"] == "test-worker"


@pytest.mark.asyncio
async def test_worker_without_url_stays_unavailable():
    engine = CosyVoiceCloneEngine("")

    assert await engine.probe() is False
    assert engine.info().ready is False
