import asyncio
import json
import time
from datetime import datetime, timezone
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from app.schemas.engine import EngineInfo


class CosyVoiceCloneEngine:
    def __init__(self, worker_url: str, timeout_seconds: float = 2.5) -> None:
        self.worker_url = worker_url.strip().rstrip("/")
        self.timeout_seconds = timeout_seconds
        self._ready = False
        self._reason = self._initial_reason()
        self._latency_ms: int | None = None
        self._worker_version: str | None = None
        self._last_checked_at: str | None = None

    def _initial_reason(self) -> str:
        if self.worker_url:
            return "Worker URL은 설정됐지만 아직 연결을 확인하지 않았습니다."
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
            self._ready = False
            self._reason = self._initial_reason()
            return False
        return await asyncio.to_thread(self._probe_sync)

    def probe_snapshot(self) -> dict[str, str | int | bool | None]:
        return {
            "ready": self._ready,
            "reason": self._reason,
            "latency_ms": self._latency_ms,
            "worker_version": self._worker_version,
            "last_checked_at": self._last_checked_at,
        }

    def _probe_sync(self) -> bool:
        started = time.perf_counter()
        request = Request(
            f"{self.worker_url}/health",
            headers={"Accept": "application/json", "User-Agent": "SoriON-API/0.6.4"},
        )
        self._last_checked_at = datetime.now(timezone.utc).isoformat()
        try:
            with urlopen(request, timeout=self.timeout_seconds) as response:
                raw = response.read(65_536)
                payload = json.loads(raw.decode("utf-8")) if raw else {}
                status = str(payload.get("status", "")).lower()
                self._ready = response.status == 200 and status in {"ok", "ready", "healthy"}
                self._worker_version = str(payload.get("version") or "unknown")
                self._reason = (
                    f"Worker {self._worker_version} 연결을 확인했습니다."
                    if self._ready
                    else "Worker health 응답이 준비 상태가 아닙니다."
                )
        except HTTPError as error:
            self._ready = False
            self._reason = f"Worker health가 HTTP {error.code}로 응답했습니다."
        except (URLError, TimeoutError, OSError, json.JSONDecodeError) as error:
            self._ready = False
            self._reason = f"Worker에 연결할 수 없습니다: {error}"
        self._latency_ms = round((time.perf_counter() - started) * 1000)
        return self._ready
