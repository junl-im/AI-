from app.services.rate_limit import FixedWindowRateLimiter


def test_rate_limiter_blocks_after_limit_and_recovers():
    limiter = FixedWindowRateLimiter(limit=2, window_seconds=10)
    assert limiter.check("user", now=0)[0] is True
    assert limiter.check("user", now=1)[0] is True
    assert limiter.check("user", now=2)[0] is False
    assert limiter.check("user", now=11)[0] is True
