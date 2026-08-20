from datetime import datetime, timedelta, timezone
from pathlib import Path

from app.services.neural_preview_cache import NeuralPreviewCache


def test_neural_preview_cache_reuses_verified_audio_and_rejects_tamper(tmp_path: Path):
    cache = NeuralPreviewCache(tmp_path / "cache", ttl_minutes=60)
    source = tmp_path / "source.wav"
    source.write_bytes(b"RIFF-sorion-neural-preview")
    text_sha = cache.text_digest("안녕하세요. 소리온입니다.")
    style_sha = cache.style_digest(emotion="neutral", speed=1.06, pitch=0)
    preview_key = "a" * 64
    cache_id = cache.cache_id(preview_key, text_sha, style_sha)

    entry = cache.put(
        cache_id=cache_id,
        source_audio=source,
        voice_id="sori-warm",
        preview_cache_key=preview_key,
        text_sha256=text_sha,
        style_sha256=style_sha,
        engine_id="cosyvoice3",
        model_fingerprint="b" * 64,
        reference_fingerprint="c" * 64,
        first_audio_ms=320,
        processing_ms=900,
        duration_seconds=1.8,
    )

    loaded = cache.get(cache_id)
    assert loaded == entry
    assert loaded.audio_sha256 == cache.sha256_file(cache.audio_path(cache_id))

    cache.audio_path(cache_id).write_bytes(b"tampered")
    assert cache.get(cache_id) is None


def test_neural_preview_cache_cleanup_removes_expired_pair(tmp_path: Path):
    cache = NeuralPreviewCache(tmp_path / "cache", ttl_minutes=30)
    source = tmp_path / "source.wav"
    source.write_bytes(b"audio")
    text_sha = cache.text_digest("테스트")
    style_sha = cache.style_digest(emotion="neutral", speed=1.0, pitch=0)
    cache_id = cache.cache_id("d" * 64, text_sha, style_sha)
    cache.put(
        cache_id=cache_id,
        source_audio=source,
        voice_id="on-clear",
        preview_cache_key="d" * 64,
        text_sha256=text_sha,
        style_sha256=style_sha,
        engine_id="cosyvoice3",
        model_fingerprint="e" * 64,
        reference_fingerprint="f" * 64,
        first_audio_ms=None,
        processing_ms=None,
        duration_seconds=1.0,
    )

    future = datetime.now(timezone.utc) + timedelta(minutes=31)
    assert cache.cleanup_expired(future) == 1
    assert cache.resolve_audio(cache_id) is None
    assert not cache.metadata_path(cache_id).exists()
