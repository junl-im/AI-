import os
import platform
import sys
from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True)
class RuntimeSnapshot:
    python_version: str
    platform: str
    process_id: int
    memory_mb: float | None
    open_file_descriptors: int | None


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


def _open_file_descriptors() -> int | None:
    proc_fd = Path("/proc/self/fd")
    try:
        if proc_fd.is_dir():
            return len(list(proc_fd.iterdir()))
    except OSError:
        pass

    try:
        import psutil

        process = psutil.Process()
        if hasattr(process, "num_fds"):
            return int(process.num_fds())
        if hasattr(process, "num_handles"):
            return int(process.num_handles())
    except (ImportError, OSError, ValueError):
        return None
    return None


def runtime_snapshot() -> RuntimeSnapshot:
    return RuntimeSnapshot(
        python_version=platform.python_version(),
        platform=f"{platform.system()} {platform.release()}",
        process_id=os.getpid(),
        memory_mb=_memory_mb(),
        open_file_descriptors=_open_file_descriptors(),
    )
