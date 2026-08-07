from __future__ import annotations

import json
import os
from datetime import datetime
from pathlib import Path
from threading import Lock

from app.schemas.verification import (
    OperatorBaselineHistoryEntry,
    OperatorBenchmarkBaseline,
)


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
                    "replacement_baseline_id": baseline.baseline_id,
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

    def restore(
        self,
        baseline_id: str,
        actor: str,
        reason: str,
        at: str,
    ) -> OperatorBenchmarkBaseline | None:
        with self._lock:
            baselines = self._baseline_by_id_unlocked()
            target = baselines.get(baseline_id)
            if target is None:
                return None
            active = self._active_by_group_unlocked()
            previous = active.get(target.group_key)
            if previous is not None and previous.baseline_id != target.baseline_id:
                self._append_unlocked({
                    "event": "retired",
                    "baseline_id": previous.baseline_id,
                    "at": at,
                    "actor": actor,
                    "reason": f"과거 기준선 {target.baseline_id} 복원으로 교체",
                    "replacement_baseline_id": target.baseline_id,
                })
            self._append_unlocked({
                "event": "restored",
                "baseline_id": target.baseline_id,
                "at": at,
                "actor": actor,
                "reason": reason,
            })
            return target

    def get(self, baseline_id: str) -> OperatorBenchmarkBaseline | None:
        with self._lock:
            return self._baseline_by_id_unlocked().get(baseline_id)

    def active_by_group(self) -> dict[str, OperatorBenchmarkBaseline]:
        with self._lock:
            return self._active_by_group_unlocked()

    def list_active(self) -> list[OperatorBenchmarkBaseline]:
        return sorted(
            self.active_by_group().values(),
            key=lambda item: (item.preset_id, item.model_id, item.created_at),
        )

    def history(self, group_key: str | None = None) -> list[OperatorBaselineHistoryEntry]:
        with self._lock:
            events = self._read_unlocked()
            baselines = self._baseline_by_id_from_events(events)
            active_ids = {
                item.baseline_id for item in self._active_by_group_from_events(events).values()
            }
            retired: dict[str, dict[str, object]] = {}
            restored: dict[str, dict[str, object]] = {}
            for event in events:
                baseline_id = str(event.get("baseline_id") or "")
                if not baseline_id:
                    continue
                if event.get("event") == "retired":
                    retired[baseline_id] = event
                elif event.get("event") == "restored":
                    restored[baseline_id] = event

            results: list[OperatorBaselineHistoryEntry] = []
            for baseline in baselines.values():
                if group_key is not None and baseline.group_key != group_key:
                    continue
                retired_event = retired.get(baseline.baseline_id, {})
                restored_event = restored.get(baseline.baseline_id, {})
                results.append(OperatorBaselineHistoryEntry(
                    baseline=baseline,
                    status="active" if baseline.baseline_id in active_ids else "retired",
                    retired_at=self._event_datetime(retired_event.get("at")),
                    retired_by=str(retired_event.get("actor") or ""),
                    retired_reason=str(retired_event.get("reason") or ""),
                    replacement_baseline_id=str(retired_event.get("replacement_baseline_id") or ""),
                    last_restored_at=self._event_datetime(restored_event.get("at")),
                    last_restored_by=str(restored_event.get("actor") or ""),
                    last_restore_reason=str(restored_event.get("reason") or ""),
                ))
            return sorted(results, key=lambda item: item.baseline.created_at, reverse=True)

    @staticmethod
    def _event_datetime(value: object) -> datetime | None:
        if not isinstance(value, str) or not value:
            return None
        try:
            return datetime.fromisoformat(value)
        except ValueError:
            return None

    def _baseline_by_id_unlocked(self) -> dict[str, OperatorBenchmarkBaseline]:
        return self._baseline_by_id_from_events(self._read_unlocked())

    @staticmethod
    def _baseline_by_id_from_events(
        events: list[dict[str, object]],
    ) -> dict[str, OperatorBenchmarkBaseline]:
        baselines: dict[str, OperatorBenchmarkBaseline] = {}
        for event in events:
            if event.get("event") != "created" or not isinstance(event.get("baseline"), dict):
                continue
            try:
                baseline = OperatorBenchmarkBaseline.model_validate(event["baseline"])
            except Exception:
                continue
            baselines[baseline.baseline_id] = baseline
        return baselines

    def _active_by_group_unlocked(self) -> dict[str, OperatorBenchmarkBaseline]:
        return self._active_by_group_from_events(self._read_unlocked())

    @classmethod
    def _active_by_group_from_events(
        cls,
        events: list[dict[str, object]],
    ) -> dict[str, OperatorBenchmarkBaseline]:
        active: dict[str, OperatorBenchmarkBaseline] = {}
        baselines = cls._baseline_by_id_from_events(events)
        for event in events:
            kind = event.get("event")
            if kind == "created" and isinstance(event.get("baseline"), dict):
                try:
                    baseline = OperatorBenchmarkBaseline.model_validate(event["baseline"])
                except Exception:
                    continue
                active[baseline.group_key] = baseline
            elif kind == "retired":
                baseline_id = str(event.get("baseline_id") or "")
                baseline = baselines.get(baseline_id)
                if baseline is not None and active.get(baseline.group_key) is not None:
                    if active[baseline.group_key].baseline_id == baseline_id:
                        active.pop(baseline.group_key, None)
            elif kind == "restored":
                baseline_id = str(event.get("baseline_id") or "")
                baseline = baselines.get(baseline_id)
                if baseline is not None:
                    active[baseline.group_key] = baseline
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
