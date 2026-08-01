import json
import time
from collections.abc import AsyncIterator
from datetime import datetime, timezone
from pathlib import Path

import httpx

from app.schemas.engine import EngineInfo
from app.services.worker_auth import build_worker_auth_headers


class WorkerClientError(RuntimeError):
    def __init__(self, message: str, status_code: int = 502) -> None:
        super().__init__(message)
        self.status_code = status_code


class CosyVoiceCloneEngine:
    def __init__(
        self,
        worker_url: str,
        timeout_seconds: float = 2.5,
        job_timeout_seconds: float = 45.0,
        service_token: str = "",
        signature_secret: str = "",
        transport: httpx.AsyncBaseTransport | None = None,
    ) -> None:
        self.worker_url = worker_url.strip().rstrip("/")
        self.timeout_seconds = timeout_seconds
        self.job_timeout_seconds = job_timeout_seconds
        self.service_token = service_token
        self.signature_secret = signature_secret
        self.transport = transport
        self._ready = False
        self._health_ok = False
        self._reason = self._initial_reason()
        self._latency_ms: int | None = None
        self._worker_version: str | None = None
        self._last_checked_at: str | None = None
        self._diagnostics: dict[str, object] | None = None

    def _initial_reason(self) -> str:
        if self.worker_url:
            return "Worker URL은 설정됐지만 아직 readiness를 확인하지 않았습니다."
        return "SORION_COSYVOICE_WORKER_URL을 설정하면 별도 모델 Worker와 연결됩니다."

    def info(self) -> EngineInfo:
        return EngineInfo(
            id="cosyvoice3-worker",
            name="Fun-CosyVoice 3 Worker",
            kind="voiceclone",
            mode="ai",
            provider="FunAudioLLM",
            languages=["ko", "en", "ja", "zh", "de", "es", "fr", "it", "ru"],
            output_formats=["wav"],
            supports_emotion=True,
            supports_speed=True,
            supports_pitch=False,
            supports_voice_clone=True,
            ready=self._ready,
            reason=self._reason,
        )

    async def probe(self) -> bool:
        if not self.worker_url:
            self._health_ok = False
            self._ready = False
            self._reason = self._initial_reason()
            return False
        started = time.perf_counter()
        self._last_checked_at = datetime.now(timezone.utc).isoformat()
        try:
            health = await self._request_json("GET", "/health", self.timeout_seconds, False)
            self._health_ok = health.get("status") == "ok"
            readiness = await self._request_json("GET", "/ready", self.timeout_seconds)
            self._worker_version = str(health.get("version") or "unknown")
            diagnostics = readiness.get("diagnostics")
            self._diagnostics = diagnostics if isinstance(diagnostics, dict) else None
            ready_flag = bool(self._diagnostics and self._diagnostics.get("ready"))
            self._ready = readiness.get("status") == "ready" and ready_flag
            reason = self._diagnostics.get("reason") if self._diagnostics else None
            self._reason = (
                f"Worker {self._worker_version} readiness를 확인했습니다."
                if self._ready
                else str(reason or "Worker 프로세스는 살아 있지만 모델이 준비되지 않았습니다.")
            )
        except WorkerClientError as error:
            self._health_ok = False
            self._ready = False
            self._reason = str(error)
        self._latency_ms = round((time.perf_counter() - started) * 1000)
        return self._ready

    def probe_snapshot(self) -> dict[str, object]:
        return {
            "ready": self._ready,
            "health_ok": self._health_ok,
            "reason": self._reason,
            "latency_ms": self._latency_ms,
            "worker_version": self._worker_version,
            "last_checked_at": self._last_checked_at,
            "diagnostics": self._diagnostics,
        }

    async def diagnostics(self) -> dict[str, object]:
        return await self._request_json("GET", "/v1/diagnostics", self.timeout_seconds)

    async def create_job(
        self,
        profile_id: str,
        text: str,
        sample_path: Path,
    ) -> dict[str, object]:
        self._require_worker_url()
        path = "/v1/jobs"
        try:
            async with httpx.AsyncClient(
                transport=self.transport,
                timeout=self.job_timeout_seconds,
            ) as client:
                with sample_path.open("rb") as sample:
                    request = client.build_request(
                        "POST",
                        f"{self.worker_url}{path}",
                        data={"profile_id": profile_id, "text": text},
                        files={
                            "sample": (sample_path.name, sample, "application/octet-stream")
                        },
                        headers={"User-Agent": "SoriON-API/0.8.0"},
                    )
                    body = await request.aread()
                    request.headers.update(self._auth_headers("POST", path, body))
                    response = await client.send(request)
            return self._decode_response(response)
        except (httpx.HTTPError, OSError) as error:
            raise WorkerClientError(f"Worker 작업을 시작하지 못했습니다: {error}") from error

    async def get_job(self, job_id: str) -> dict[str, object]:
        return await self._request_json("GET", f"/v1/jobs/{job_id}", self.timeout_seconds)

    async def cancel_job(self, job_id: str) -> dict[str, object]:
        return await self._request_json(
            "POST",
            f"/v1/jobs/{job_id}/cancel",
            self.timeout_seconds,
        )

    async def retry_job(self, job_id: str) -> dict[str, object]:
        return await self._request_json(
            "POST",
            f"/v1/jobs/{job_id}/retry",
            self.timeout_seconds,
        )

    async def download_audio(self, job_id: str, segment_index: int | None = None) -> bytes:
        suffix = f"/segments/{segment_index}/audio" if segment_index else "/audio"
        path = f"/v1/jobs/{job_id}{suffix}"
        self._require_worker_url()
        try:
            async with httpx.AsyncClient(
                transport=self.transport,
                timeout=self.job_timeout_seconds,
            ) as client:
                response = await client.get(
                    f"{self.worker_url}{path}",
                    headers=self._auth_headers("GET", path, b""),
                )
            if not response.is_success:
                self._raise_for_response(response)
            return response.content
        except httpx.HTTPError as error:
            raise WorkerClientError(f"Worker 음원을 받지 못했습니다: {error}") from error

    async def stream_events(
        self,
        job_id: str,
        last_event_id: str | None = None,
    ) -> AsyncIterator[bytes]:
        self._require_worker_url()
        path = f"/v1/jobs/{job_id}/events"
        headers = {"Accept": "text/event-stream", **self._auth_headers("GET", path, b"")}
        if last_event_id:
            headers["Last-Event-ID"] = last_event_id
        try:
            async with httpx.AsyncClient(transport=self.transport, timeout=None) as client:
                async with client.stream(
                    "GET",
                    f"{self.worker_url}{path}",
                    headers=headers,
                ) as response:
                    if not response.is_success:
                        self._raise_for_response(response)
                    async for chunk in response.aiter_bytes():
                        yield chunk
        except httpx.HTTPError as error:
            raise WorkerClientError(f"Worker 이벤트 연결이 끊겼습니다: {error}") from error

    async def _request_json(
        self,
        method: str,
        path: str,
        timeout_seconds: float,
        authenticate: bool = True,
    ) -> dict[str, object]:
        self._require_worker_url()
        headers = {
            "Accept": "application/json",
            "User-Agent": "SoriON-API/0.8.0",
        }
        if authenticate:
            headers.update(self._auth_headers(method, path, b""))
        try:
            async with httpx.AsyncClient(
                transport=self.transport,
                timeout=timeout_seconds,
            ) as client:
                response = await client.request(method, f"{self.worker_url}{path}", headers=headers)
            return self._decode_response(response)
        except httpx.HTTPError as error:
            raise WorkerClientError(f"Worker에 연결할 수 없습니다: {error}") from error

    def _auth_headers(self, method: str, path: str, body: bytes) -> dict[str, str]:
        return build_worker_auth_headers(
            method,
            path,
            body,
            self.service_token,
            self.signature_secret,
        )

    def _decode_response(self, response: httpx.Response) -> dict[str, object]:
        if not response.is_success:
            self._raise_for_response(response)
        try:
            payload = response.json()
        except json.JSONDecodeError as error:
            raise WorkerClientError("Worker JSON 응답을 해석하지 못했습니다.") from error
        if not isinstance(payload, dict):
            raise WorkerClientError("Worker 응답 형식이 객체가 아닙니다.")
        return payload

    def _raise_for_response(self, response: httpx.Response) -> None:
        detail = None
        try:
            payload = response.json()
            if isinstance(payload, dict):
                detail = payload.get("detail")
        except json.JSONDecodeError:
            pass
        message = str(detail or f"Worker가 HTTP {response.status_code}로 응답했습니다.")
        raise WorkerClientError(message, response.status_code)

    def _require_worker_url(self) -> None:
        if not self.worker_url:
            raise WorkerClientError(self._initial_reason(), 503)
