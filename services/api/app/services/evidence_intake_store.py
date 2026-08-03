from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path
from threading import Lock
from typing import Any


class EvidenceIntakeStore:
    def __init__(self, index_path: Path) -> None:
        self.index_path = index_path
        self.bundle_directory = index_path.parent / "imported-evidence"
        self.index_path.parent.mkdir(parents=True, exist_ok=True)
        self.bundle_directory.mkdir(parents=True, exist_ok=True)
        self._lock = Lock()

    def list(self, limit: int = 200) -> list[dict[str, Any]]:
        if not self.index_path.exists():
            return []
        results: list[dict[str, Any]] = []
        for line in reversed(self.index_path.read_text(encoding="utf-8").splitlines()[-limit:]):
            try:
                value = json.loads(line)
            except json.JSONDecodeError:
                continue
            if isinstance(value, dict):
                results.append(value)
        return results

    def bundle_sha256s(self) -> set[str]:
        return {
            str(item.get("bundle_sha256"))
            for item in self.list(limit=10_000)
            if item.get("bundle_sha256")
        }

    def record_sha256s(self) -> set[str]:
        values: set[str] = set()
        for item in self.list(limit=10_000):
            for digest in item.get("record_sha256s", []):
                if isinstance(digest, str):
                    values.add(digest)
        return values

    def append_bundle(
        self,
        *,
        bundle: dict[str, object],
        source: dict[str, object],
        bundle_sha256: str,
        record_sha256s: list[str],
    ) -> dict[str, object]:
        bundle_path = self.bundle_directory / f"{bundle_sha256}.json"
        index_record = {
            "bundle_sha256": bundle_sha256,
            "schema_version": str(bundle.get("schema_version", bundle.get("schemaVersion", ""))),
            "app_version": str(bundle.get("app_version", bundle.get("appVersion", ""))),
            "record_count": len(record_sha256s),
            "record_sha256s": record_sha256s,
            "source_name": str(source.get("name", "imported-evidence.json"))[:240],
            "source_kind": str(source.get("kind", "manual"))[:40],
            "commit_sha": str(source.get("commit_sha", ""))[:80],
            "run_id": str(source.get("run_id", ""))[:120],
            "imported_at": datetime.now(timezone.utc).isoformat(),
            "bundle_path": str(bundle_path),
        }
        serialized_bundle = json.dumps(bundle, ensure_ascii=False, indent=2, sort_keys=True)
        serialized_record = json.dumps(index_record, ensure_ascii=False, separators=(",", ":"))
        with self._lock:
            if bundle_path.exists() or bundle_sha256 in self.bundle_sha256s():
                raise FileExistsError(bundle_sha256)
            duplicate_records = sorted(set(record_sha256s) & self.record_sha256s())
            if duplicate_records:
                raise ValueError(duplicate_records[0])
            temp_path = bundle_path.with_suffix(".json.part")
            temp_path.write_text(f"{serialized_bundle}\n", encoding="utf-8")
            temp_path.replace(bundle_path)
            with self.index_path.open("a", encoding="utf-8") as stream:
                stream.write(f"{serialized_record}\n")
        return index_record
