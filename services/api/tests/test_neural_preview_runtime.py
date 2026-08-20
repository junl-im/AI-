from types import SimpleNamespace

import pytest
from fastapi import HTTPException
from starlette.requests import Request

from app.api.routes import tts as tts_routes
from app.schemas.tts import NeuralPreviewRequest


class ReadyWorker:
    def __init__(self, digest: str):
        self.digest = digest

    async def probe(self, force: bool = False) -> bool:
        assert force is True
        return True

    def probe_snapshot(self):
        return {"diagnostics": {"model_digest": self.digest, "ready": True}}


def request_with_worker(worker: ReadyWorker) -> Request:
    app = SimpleNamespace(state=SimpleNamespace(settings=object(), cosyvoice_worker=worker))
    return Request({
        "type": "http",
        "method": "POST",
        "path": "/api/v1/tts/neural-preview",
        "headers": [],
        "query_string": b"",
        "server": ("testserver", 80),
        "client": ("127.0.0.1", 1234),
        "scheme": "http",
        "app": app,
    })


def payload(cache_key: str = "a" * 64) -> NeuralPreviewRequest:
    return NeuralPreviewRequest(
        text="소리온 neural runtime 테스트입니다.",
        voice_id="sori-warm",
        speed=1.06,
        pitch=0,
        output_format="wav",
        engine_id="cosyvoice3",
        expected_preview_cache_key=cache_key,
    )


@pytest.mark.asyncio
async def test_neural_runtime_requires_worker_model_digest_match(monkeypatch):
    diagnostic = SimpleNamespace(
        neural_preview_ready=True,
        preview_cache_key="a" * 64,
        model_fingerprint="b" * 64,
    )
    monkeypatch.setattr(tts_routes, "_neural_runtime_diagnostic", lambda *_: diagnostic)
    request = request_with_worker(ReadyWorker("c" * 64))

    with pytest.raises(HTTPException) as caught:
        await tts_routes._require_neural_runtime_ready(request, payload())

    assert caught.value.status_code == 409
    assert "SOA-4032" in caught.value.detail


@pytest.mark.asyncio
async def test_neural_runtime_accepts_matching_provenance_and_worker_digest(monkeypatch):
    diagnostic = SimpleNamespace(
        neural_preview_ready=True,
        preview_cache_key="a" * 64,
        model_fingerprint="b" * 64,
    )
    monkeypatch.setattr(tts_routes, "_neural_runtime_diagnostic", lambda *_: diagnostic)
    request = request_with_worker(ReadyWorker("b" * 64))

    resolved = await tts_routes._require_neural_runtime_ready(request, payload())

    assert resolved is diagnostic
