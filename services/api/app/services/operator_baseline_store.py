from __future__ import annotations

import json
import os
from pathlib import Path
from threading import Lock

from app.schemas.verification import OperatorBenchmarkBaseline


class OperatorBaselineStore:
    def __init__(self, path: Path) -> None:
        self.path = path
        self.path.parent.mkdir(parents=True, exist_ok=True)
        self._lock = Lock()

    def create(self, baseline: OperatorBenchmarkBaseline) -> OperatorBenchmarkBaseline:
        with self._lock:
            active = self._active_by_group_unlocked()
            previous = active.get(baseline.group_key)
            if previous is not None:
                self._append_unlocked({
                    "event": "retired",
                    "baseline_id": previous.baseline_id,
                    "at": baseline.created_at.isoformat(),
                    "actor": baseline.actor,
                    "reason": f"새 기준선 {baseline.baseline_id}으로 교체",
                })
            self._append_unlocked({
                "event": "created",
                "baseline": baseline.model_dump(mode="json"),
            })
        return baseline

    def retire(self, baseline_id: str, actor: str, reason: str, at: str) -> bool:
        with self._lock:
            active = self._active_by_group_unlocked()
            target = next(
                (item for item in active.values() if item.baseline_id == baseline_id),
                None,
            )
            if target is None:
                return False
            self._append_unlocked({
                "event": "retired",
                "baseline_id": baseline_id,
                "at": at,
                "actor": actor,
                "reason": reason,
            })
            return True

    def active_by_group(self) -> dict[str, OperatorBenchmarkBaseline]:
        with self._lock:
            return self._active_by_group_unlocked()

    def list_active(self) -> list[OperatorBenchmarkBaseline]:
        return sorted(
            self.active_by_group().values(),
            key=lambda item: (item.preset_id, item.model_id, item.created_at),
        )

    def _active_by_group_unlocked(self) -> dict[str, OperatorBenchmarkBaseline]:
        active: dict[str, OperatorBenchmarkBaseline] = {}
        by_id: dict[str, str] = {}
        for event in self._read_unlocked():
            kind = event.get("event")
            if kind == "created" and isinstance(event.get("baseline"), dict):
                try:
                    baseline = OperatorBenchmarkBaseline.model_validate(event["baseline"])
                except Exception:
                    continue
                active[baseline.group_key] = baseline
                by_id[baseline.baseline_id] = baseline.group_key
            elif kind == "retired":
                baseline_id = str(event.get("baseline_id") or "")
                group_key = by_id.get(baseline_id)
                if group_key and active.get(group_key, None) is not None:
                    if active[group_key].baseline_id == baseline_id:
                        active.pop(group_key, None)
        return active

    def _append_unlocked(self, payload: dict[str, object]) -> None:
        with self.path.open("a", encoding="utf-8", newline="\n") as stream:
            stream.write(json.dumps(payload, ensure_ascii=False, separators=(",", ":")) + "\n")
            stream.flush()
            os.fsync(stream.fileno())

    def _read_unlocked(self) -> list[dict[str, object]]:
        if not self.path.is_file():
            return []
        results: list[dict[str, object]] = []
        for line in self.path.read_text(encoding="utf-8").splitlines():
            try:
                payload = json.loads(line)
            except json.JSONDecodeError:
                continue
            if isinstance(payload, dict):
                results.append(payload)
        return results
