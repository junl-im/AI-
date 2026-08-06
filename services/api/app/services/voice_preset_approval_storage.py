from __future__ import annotations

import json
import os
from pathlib import Path

from app.schemas.voice_preset_approval import VoicePresetApprovalRecord


class VoicePresetApprovalStorage:
    def __init__(self, history_path: Path) -> None:
        self.history_path = history_path
        self.history_path.parent.mkdir(parents=True, exist_ok=True)

    def write_manifest(self, path: Path, payload: dict[str, object]) -> None:
        temporary = path.with_name(f".{path.name}.{os.getpid()}.tmp")
        try:
            with temporary.open("w", encoding="utf-8", newline="\n") as output:
                output.write(json.dumps(payload, ensure_ascii=False, indent=2) + "\n")
                output.flush()
                os.fsync(output.fileno())
            temporary.replace(path)
            self._fsync_directory(path.parent)
        finally:
            temporary.unlink(missing_ok=True)

    def append_history(
        self,
        record: VoicePresetApprovalRecord,
        before: dict[str, object],
        after: dict[str, object],
    ) -> None:
        value = {
            "record": record.model_dump(mode="json"),
            "before_manifest": before,
            "after_manifest": after,
        }
        with self.history_path.open("a", encoding="utf-8", newline="\n") as output:
            output.write(
                json.dumps(value, ensure_ascii=False, separators=(",", ":")) + "\n"
            )
            output.flush()
            os.fsync(output.fileno())

    def read_history(self) -> list[dict[str, object]]:
        if not self.history_path.is_file():
            return []
        results: list[dict[str, object]] = []
        for line in self.history_path.read_text(encoding="utf-8").splitlines():
            try:
                value = json.loads(line)
            except json.JSONDecodeError:
                continue
            if isinstance(value, dict):
                results.append(value)
        return results

    @staticmethod
    def _fsync_directory(directory: Path) -> None:
        flags = os.O_RDONLY | getattr(os, "O_DIRECTORY", 0)
        try:
            descriptor = os.open(directory, flags)
        except OSError:
            return
        try:
            os.fsync(descriptor)
        finally:
            os.close(descriptor)
