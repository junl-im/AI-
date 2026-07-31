import hashlib
import hmac
import time


def build_worker_auth_headers(
    method: str,
    path: str,
    body: bytes,
    service_token: str,
    signature_secret: str,
    now: int | None = None,
) -> dict[str, str]:
    if not service_token or not signature_secret:
        return {}
    timestamp = str(now if now is not None else int(time.time()))
    body_hash = hashlib.sha256(body).hexdigest()
    payload = "\n".join((method.upper(), path, timestamp, body_hash))
    signature = hmac.new(
        signature_secret.encode(),
        payload.encode(),
        hashlib.sha256,
    ).hexdigest()
    return {
        "X-SoriON-Service-Token": service_token,
        "X-SoriON-Timestamp": timestamp,
        "X-SoriON-Signature": signature,
    }
