from __future__ import annotations

import hashlib
import hmac
import secrets
import time
from urllib.parse import urlencode


class SegmentAudioSigner:
    def __init__(self, secret: str, ttl_seconds: int) -> None:
        configured = secret.strip()
        self._secret = (
            configured.encode("utf-8")
            if configured
            else secrets.token_bytes(32)
        )
        self.ttl_seconds = max(30, min(3600, ttl_seconds))
        self.persistent_secret_configured = bool(configured)

    def issue(self, job_id: str, index: int, filename: str) -> str:
        expires = int(time.time()) + self.ttl_seconds
        signature = self._signature("segment", job_id, str(index), filename, expires)
        query = urlencode(
            {
                "file": filename,
                "expires": str(expires),
                "signature": signature,
            }
        )
        return f"/api/v1/tts/jobs/{job_id}/segments/{index}/audio?{query}"

    def verify(
        self,
        job_id: str,
        index: int,
        filename: str,
        expires: int,
        signature: str,
    ) -> bool:
        if not self._valid_expiry(expires):
            return False
        expected = self._signature("segment", job_id, str(index), filename, expires)
        return hmac.compare_digest(expected, signature)

    def issue_final(self, job_id: str, filename: str) -> str:
        expires = int(time.time()) + self.ttl_seconds
        signature = self._signature("final", job_id, "final", filename, expires)
        query = urlencode(
            {
                "file": filename,
                "expires": str(expires),
                "signature": signature,
            }
        )
        return f"/api/v1/tts/jobs/{job_id}/audio?{query}"

    def verify_final(
        self,
        job_id: str,
        filename: str,
        expires: int,
        signature: str,
    ) -> bool:
        if not self._valid_expiry(expires):
            return False
        expected = self._signature("final", job_id, "final", filename, expires)
        return hmac.compare_digest(expected, signature)

    def _valid_expiry(self, expires: int) -> bool:
        now = int(time.time())
        if expires < now or expires > now + self.ttl_seconds + 30:
            return False
        return True

    def _signature(
        self,
        kind: str,
        job_id: str,
        index: str,
        filename: str,
        expires: int,
    ) -> str:
        payload = f"{kind}:{job_id}:{index}:{filename}:{expires}".encode()
        return hmac.new(self._secret, payload, hashlib.sha256).hexdigest()
