import json
from datetime import datetime, timezone
from pathlib import Path
from threading import Lock


class AuditLogger:
    def __init__(self, path: Path) -> None:
        self.path = path
        self.path.parent.mkdir(parents=True, exist_ok=True)
        self._lock = Lock()

    def write(
        self,
        *,
        event: str,
        method: str,
        path: str,
        status_code: int,
        request_id: str,
        actor: str,
    ) -> None:
        record = {
            "at": datetime.now(timezone.utc).isoformat(),
            "event": event,
            "method": method,
            "path": path,
            "status_code": status_code,
            "request_id": request_id,
            "actor": actor,
        }
        line = json.dumps(record, ensure_ascii=False, separators=(",", ":"))
        with self._lock:
            with self.path.open("a", encoding="utf-8") as output:
                output.write(line + "\n")
