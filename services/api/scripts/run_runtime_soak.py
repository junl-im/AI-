from __future__ import annotations

import argparse
import json
import sys
import time
from collections.abc import Mapping
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.services.runtime_soak import (
    RuntimeProbeSample,
    RuntimeRecoveryEvent,
    build_runtime_soak_report,
    utc_now,
)
from app.version import APP_VERSION


def _request_json(url: str, timeout_seconds: float) -> tuple[int, dict[str, object], int]:
    started = time.perf_counter()
    request = Request(url, headers={"Accept": "application/json", "Cache-Control": "no-store"})
    with urlopen(request, timeout=timeout_seconds) as response:
        payload = json.loads(response.read().decode())
        latency_ms = round((time.perf_counter() - started) * 1000)
        return response.status, payload, latency_ms


def _probe(target: str, url: str, timeout_seconds: float) -> RuntimeProbeSample:
    try:
        status, payload, latency_ms = _request_json(url, timeout_seconds)
        memory = payload.get("memory_mb")
        descriptors = payload.get("open_file_descriptors")
        return RuntimeProbeSample(
            target=target,
            at=utc_now(),
            ok=200 <= status < 300,
            latency_ms=latency_ms,
            status_code=status,
            memory_mb=float(memory) if isinstance(memory, (int, float)) else None,
            open_file_descriptors=(
                int(descriptors) if isinstance(descriptors, int) else None
            ),
        )
    except HTTPError as error:
        return RuntimeProbeSample(
            target=target,
            at=utc_now(),
            ok=False,
            latency_ms=0,
            status_code=error.code,
            error=f"HTTP {error.code}",
        )
    except (URLError, TimeoutError, ValueError, json.JSONDecodeError) as error:
        return RuntimeProbeSample(
            target=target,
            at=utc_now(),
            ok=False,
            latency_ms=0,
            error=type(error).__name__,
        )


def _load_mapping(path: Path | None) -> Mapping[str, object] | None:
    if path is None or not path.is_file():
        return None
    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return None
    return payload if isinstance(payload, dict) else None


def _load_recovery_events(path: Path | None) -> list[RuntimeRecoveryEvent]:
    if path is None or not path.is_file():
        return []
    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return []
    items = payload if isinstance(payload, list) else [payload]
    events: list[RuntimeRecoveryEvent] = []
    for item in items:
        if not isinstance(item, dict):
            continue
        try:
            events.append(RuntimeRecoveryEvent(**item))
        except TypeError:
            continue
    return events


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="SoriON API·Worker 장시간 안정성 검사")
    parser.add_argument("--api-url", default="http://127.0.0.1:8000")
    parser.add_argument("--worker-url", default="http://127.0.0.1:8765")
    parser.add_argument("--duration-minutes", type=float, default=30.0)
    parser.add_argument("--interval-seconds", type=float, default=10.0)
    parser.add_argument("--timeout-seconds", type=float, default=3.0)
    parser.add_argument("--max-memory-growth-mb", type=float, default=128.0)
    parser.add_argument("--max-open-file-descriptors-growth", type=int, default=32)
    parser.add_argument("--max-outage-seconds", type=float, default=30.0)
    parser.add_argument("--max-recovery-seconds", type=float, default=45.0)
    parser.add_argument("--minimum-success-rate", type=float, default=0.99)
    parser.add_argument("--baseline-report", type=Path)
    parser.add_argument("--recovery-events", type=Path)
    parser.add_argument("--history-output", type=Path)
    parser.add_argument("--output", type=Path, default=Path(".sorion/soak/runtime-soak.json"))
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    duration_seconds = max(1.0, args.duration_minutes * 60)
    interval_seconds = max(0.2, args.interval_seconds)
    started_at = utc_now()
    deadline = time.monotonic() + duration_seconds
    samples: list[RuntimeProbeSample] = []

    while True:
        samples.append(
            _probe(
                "api",
                f"{args.api_url.rstrip('/')}/api/v1/quality/diagnostics",
                args.timeout_seconds,
            )
        )
        if args.worker_url.strip():
            samples.append(
                _probe(
                    "worker",
                    f"{args.worker_url.rstrip('/')}/health",
                    args.timeout_seconds,
                )
            )
        if time.monotonic() >= deadline:
            break
        time.sleep(min(interval_seconds, max(0.0, deadline - time.monotonic())))

    report = build_runtime_soak_report(
        app_version=APP_VERSION,
        started_at=started_at,
        completed_at=utc_now(),
        interval_seconds=interval_seconds,
        samples=samples,
        recovery_events=_load_recovery_events(args.recovery_events),
        baseline_report=_load_mapping(args.baseline_report),
        max_memory_growth_mb=args.max_memory_growth_mb,
        max_open_file_descriptors_growth=args.max_open_file_descriptors_growth,
        max_outage_seconds=args.max_outage_seconds,
        max_recovery_seconds=args.max_recovery_seconds,
        minimum_success_rate=args.minimum_success_rate,
    )
    rendered = json.dumps(report, ensure_ascii=False, indent=2) + "\n"
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(rendered, encoding="utf-8")
    if args.history_output is not None:
        args.history_output.parent.mkdir(parents=True, exist_ok=True)
        args.history_output.write_text(rendered, encoding="utf-8")
    print(
        f"Runtime soak {report['status']} · {len(samples)} samples · "
        f"SHA-256 {report['report_sha256']}"
    )
    return 1 if report["status"] == "failed" else 0


if __name__ == "__main__":
    raise SystemExit(main())
