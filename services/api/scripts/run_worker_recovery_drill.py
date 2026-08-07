from __future__ import annotations

import argparse
import json
import os
import signal
import subprocess
import time
from pathlib import Path
from urllib.error import URLError
from urllib.request import Request, urlopen


def _utc_now() -> str:
    from datetime import datetime, timezone

    return datetime.now(timezone.utc).isoformat()


def _healthy(url: str, timeout_seconds: float) -> bool:
    try:
        request = Request(url, headers={"Cache-Control": "no-store"})
        with urlopen(request, timeout=timeout_seconds) as response:
            return 200 <= response.status < 300
    except (URLError, TimeoutError, ValueError):
        return False


def _stop_process(pid: int) -> None:
    try:
        os.kill(pid, signal.SIGTERM)
    except ProcessLookupError:
        return
    deadline = time.monotonic() + 5.0
    while time.monotonic() < deadline:
        try:
            os.kill(pid, 0)
        except ProcessLookupError:
            return
        time.sleep(0.1)
    try:
        os.kill(pid, signal.SIGKILL)
    except ProcessLookupError:
        return


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Worker 재시작 자동 복구 훈련")
    parser.add_argument("--pid-file", type=Path, required=True)
    parser.add_argument("--worker-directory", type=Path, required=True)
    parser.add_argument("--health-url", default="http://127.0.0.1:8765/health")
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=8765)
    parser.add_argument("--delay-seconds", type=float, default=20.0)
    parser.add_argument("--timeout-seconds", type=float, default=45.0)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--log", type=Path, required=True)
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    time.sleep(max(0.0, args.delay_seconds))
    started_at = _utc_now()
    started = time.monotonic()
    event: dict[str, object] = {
        "kind": "worker-restart",
        "target": "worker",
        "started_at": started_at,
        "recovered_at": None,
        "ok": False,
        "recovery_seconds": None,
        "error": None,
    }
    process: subprocess.Popen[bytes] | None = None
    try:
        old_pid = int(args.pid_file.read_text(encoding="utf-8").strip())
        _stop_process(old_pid)
        args.log.parent.mkdir(parents=True, exist_ok=True)
        log_stream = args.log.open("ab")
        env = os.environ.copy()
        env.setdefault("SORION_WORKER_REQUIRE_MODEL_MANIFEST", "false")
        env.setdefault("SORION_WORKER_OUTPUT_PATH", str(args.log.parent / "worker"))
        process = subprocess.Popen(
            [
                "uv",
                "run",
                "--locked",
                "uvicorn",
                "app.main:app",
                "--host",
                args.host,
                "--port",
                str(args.port),
            ],
            cwd=args.worker_directory,
            env=env,
            stdout=log_stream,
            stderr=subprocess.STDOUT,
        )
        log_stream.close()
        args.pid_file.write_text(f"{process.pid}\n", encoding="utf-8")
        deadline = time.monotonic() + max(1.0, args.timeout_seconds)
        while time.monotonic() < deadline:
            if process.poll() is not None:
                raise RuntimeError(f"Worker가 복구 전에 종료됐습니다: {process.returncode}")
            if _healthy(args.health_url, 2.0):
                recovered_at = _utc_now()
                event.update(
                    {
                        "recovered_at": recovered_at,
                        "ok": True,
                        "recovery_seconds": round(time.monotonic() - started, 2),
                    }
                )
                break
            time.sleep(0.5)
        else:
            event["error"] = "recovery-timeout"
    except Exception as error:  # noqa: BLE001 - evidence must survive all drill failures
        event["error"] = f"{type(error).__name__}: {error}"
    finally:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(
            json.dumps(event, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )
    print(
        f"Worker recovery drill {'passed' if event['ok'] else 'failed'} · "
        f"{event['recovery_seconds']}s"
    )
    return 0 if event["ok"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
