import asyncio
import time
import wave
from pathlib import Path

from fastapi.testclient import TestClient

from app.config import WorkerSettings
from app.main import create_app
from app.runtime import RuntimeDiagnostics


class FakeRuntime:
    def __init__(self, ready: bool = True, delay: float = 0.01) -> None:
        self.ready = ready
        self.delay = delay

    def diagnostics(self) -> RuntimeDiagnostics:
        return RuntimeDiagnostics(
            ready=self.ready,
            backend="test" if self.ready else "unavailable",
            reason="테스트 준비됨" if self.ready else "테스트 준비 안 됨",
            device="cpu",
            model_path=None,
            model_exists=False,
            adapter_module="tests.fake",
            adapter_loaded=self.ready,
            torch_available=False,
            cuda_available=False,
            cuda_device_count=0,
            gpu_name=None,
            vram_total_mb=None,
        )

    async def generate(
        self,
        _sample_path: Path,
        _text: str,
        output_path: Path,
        on_progress,
        cancel_event: asyncio.Event,
    ) -> None:
        for progress in (25, 60, 100):
            if cancel_event.is_set():
                raise asyncio.CancelledError
            await on_progress(progress, "테스트 음성 생성 중")
            await asyncio.sleep(self.delay)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        with wave.open(str(output_path), "wb") as writer:
            writer.setnchannels(1)
            writer.setsampwidth(2)
            writer.setframerate(16_000)
            writer.writeframes(b"\x00\x00" * 1600)


def settings(tmp_path: Path) -> WorkerSettings:
    return WorkerSettings(
        output_path=tmp_path,
        adapter_module="tests.fake",
        max_concurrent_jobs=1,
    )


def wait_for_terminal(client: TestClient, job_id: str) -> dict:
    for _ in range(100):
        body = client.get(f"/v1/jobs/{job_id}").json()
        if body["status"] in {"completed", "failed", "cancelled"}:
            return body
        time.sleep(0.01)
    raise AssertionError("작업이 제한 시간 안에 끝나지 않았습니다.")


def test_default_runtime_starts_without_model_path(tmp_path: Path):
    app = create_app(WorkerSettings(output_path=tmp_path))
    with TestClient(app) as client:
        assert client.get("/health").status_code == 200
        readiness = client.get("/ready").json()
        assert readiness["status"] == "not-ready"
        assert "SORION_WORKER_MODEL_PATH" in readiness["diagnostics"]["reason"]


def test_health_and_readiness_are_separate(tmp_path: Path):
    app = create_app(settings(tmp_path), FakeRuntime(ready=False))
    with TestClient(app) as client:
        assert client.get("/health").json()["status"] == "ok"
        ready = client.get("/ready").json()
        assert ready["status"] == "not-ready"
        assert ready["diagnostics"]["ready"] is False


def test_worker_rejects_job_when_runtime_is_not_ready(tmp_path: Path):
    app = create_app(settings(tmp_path), FakeRuntime(ready=False))
    with TestClient(app) as client:
        response = client.post(
            "/v1/jobs",
            data={"profile_id": "profile-1", "text": "안녕하세요."},
            files={"sample": ("sample.wav", b"sample", "audio/wav")},
        )
        assert response.status_code == 503
        assert "SOA-W2001" in response.json()["detail"]


def test_worker_generates_segments_and_final_audio(tmp_path: Path):
    app = create_app(settings(tmp_path), FakeRuntime())
    with TestClient(app) as client:
        response = client.post(
            "/v1/jobs",
            data={
                "profile_id": "profile-1",
                "text": "첫 번째 문장입니다. 두 번째 문장입니다.",
            },
            files={"sample": ("sample.wav", b"sample", "audio/wav")},
        )
        assert response.status_code == 202
        job_id = response.json()["id"]
        body = wait_for_terminal(client, job_id)
        assert body["status"] == "completed"
        assert body["progress"] == 100
        assert body["first_audio_ms"] is not None
        assert len(body["segments"]) == 2
        assert all(segment["status"] == "completed" for segment in body["segments"])
        audio = client.get(f"/v1/jobs/{job_id}/audio")
        assert audio.status_code == 200
        assert audio.content[:4] == b"RIFF"


def test_worker_can_cancel_and_retry(tmp_path: Path):
    app = create_app(settings(tmp_path), FakeRuntime(delay=0.08))
    with TestClient(app) as client:
        response = client.post(
            "/v1/jobs",
            data={"profile_id": "profile-1", "text": "취소 테스트입니다."},
            files={"sample": ("sample.wav", b"sample", "audio/wav")},
        )
        job_id = response.json()["id"]
        cancelled = client.post(f"/v1/jobs/{job_id}/cancel").json()
        assert cancelled["status"] == "cancelled"
        retried = client.post(f"/v1/jobs/{job_id}/retry").json()
        assert retried["status"] in {"queued", "running"}
        completed = wait_for_terminal(client, job_id)
        assert completed["status"] == "completed"
