from __future__ import annotations

import os
from pathlib import Path


def _read_version() -> str:
    configured = os.getenv("SORION_APP_VERSION", "").strip()
    if configured:
        return configured
    version_file = Path(__file__).resolve().parents[3] / "VERSION"
    try:
        value = version_file.read_text(encoding="utf-8").strip()
    except OSError:
        value = ""
    return value or "0.0.0-dev"


APP_VERSION = _read_version()
