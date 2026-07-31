import time
from collections import defaultdict, deque
from threading import Lock


class FixedWindowRateLimiter:
    def __init__(self, limit: int, window_seconds: int = 60) -> None:
        self.limit = max(1, limit)
        self.window_seconds = max(1, window_seconds)
        self._events: dict[str, deque[float]] = defaultdict(deque)
        self._lock = Lock()

    def check(self, key: str, now: float | None = None) -> tuple[bool, int, int]:
        current = now if now is not None else time.time()
        cutoff = current - self.window_seconds
        with self._lock:
            events = self._events[key]
            while events and events[0] <= cutoff:
                events.popleft()
            allowed = len(events) < self.limit
            if allowed:
                events.append(current)
            remaining = max(0, self.limit - len(events))
            reset = int((events[0] + self.window_seconds) if events else current)
            return allowed, remaining, reset
