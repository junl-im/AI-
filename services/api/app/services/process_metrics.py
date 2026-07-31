import os
import platform
import sys
from dataclasses import dataclass


@dataclass(frozen=True)
class RuntimeSnapshot:
    python_version: str
    platform: str
    process_id: int
    memory_mb: float | None


def _memory_mb() -> float | None:
    try:
        import psutil

        return round(psutil.Process().memory_info().rss / (1024 * 1024), 1)
    except (ImportError, OSError):
        pass

    try:
        import resource

        usage = resource.getrusage(resource.RUSAGE_SELF).ru_maxrss
        divisor = 1024 * 1024 if sys.platform == "darwin" else 1024
        return round(usage / divisor, 1)
    except (ImportError, OSError, ValueError):
        return None


def runtime_snapshot() -> RuntimeSnapshot:
    return RuntimeSnapshot(
        python_version=platform.python_version(),
        platform=f"{platform.system()} {platform.release()}",
        process_id=os.getpid(),
        memory_mb=_memory_mb(),
    )
