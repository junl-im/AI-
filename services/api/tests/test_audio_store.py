from datetime import datetime, timedelta, timezone
from os import utime
from uuid import uuid4

from app.storage.audio_store import AudioStore


def test_audio_store_blocks_path_traversal(tmp_path):
    store = AudioStore(tmp_path, ttl_minutes=30)
    assert store.resolve("../secret.wav") is None


def test_audio_store_removes_expired_files(tmp_path):
    store = AudioStore(tmp_path, ttl_minutes=10)
    path = store.output_path(uuid4())
    path.write_bytes(b"RIFF" + b"0" * 64)
    old = datetime.now(timezone.utc) - timedelta(minutes=20)
    utime(path, (old.timestamp(), old.timestamp()))

    assert store.cleanup_expired() == 1
    assert not path.exists()
