import wave
from uuid import uuid4


def _write_wave(path, seconds: float, sample_rate: int = 8000):
    frames = round(seconds * sample_rate)
    with wave.open(str(path), "wb") as stream:
        stream.setnchannels(1)
        stream.setsampwidth(2)
        stream.setframerate(sample_rate)
        stream.writeframes(b"\x00\x00" * frames)


def test_final_export_merges_wav_and_creates_subtitles(client):
    store = client.app.state.audio_store
    first = store.output_path(uuid4(), "wav")
    second = store.output_path(uuid4(), "wav")
    _write_wave(first, 1.0)
    _write_wave(second, 0.5)

    response = client.post(
        "/api/v1/exports",
        json={
            "output_format": "wav",
            "segments": [
                {
                    "kind": "voice",
                    "text": "첫 문장",
                    "audio_filename": first.name,
                    "status": "ready",
                },
                {"kind": "pause", "duration_ms": 500},
                {
                    "kind": "voice",
                    "text": "둘째 문장",
                    "audio_filename": second.name,
                    "status": "ready",
                },
            ],
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["duration_seconds"] == 2.0
    assert body["audio_url"].endswith(".wav")
    assert body["srt_url"].endswith(".srt")
    assert body["server_retention_minutes"] == 30
    assert body["preservation_mode"] == "download-only"
    assert body["server_expires_at"]
    srt_name = body["srt_url"].rsplit("/", 1)[-1]
    srt = store.resolve(srt_name).read_text(encoding="utf-8")
    assert "00:00:01,500 --> 00:00:02,000" in srt


def test_final_export_blocks_incomplete_segments(client):
    response = client.post(
        "/api/v1/exports",
        json={
            "segments": [
                {"kind": "voice", "text": "실패", "status": "failed"},
            ],
        },
    )

    assert response.status_code == 409
    assert "완료되지 않은 음성 구간" in response.json()["detail"]


def test_final_export_converts_mp3_with_local_ffmpeg(client):
    import shutil

    if shutil.which("ffmpeg") is None:
        import pytest

        pytest.skip("FFmpeg가 설치된 환경에서만 실제 MP3 변환을 검증합니다.")

    store = client.app.state.audio_store
    source = store.output_path(uuid4(), "wav")
    _write_wave(source, 0.25)

    response = client.post(
        "/api/v1/exports",
        json={
            "output_format": "mp3",
            "segments": [
                {
                    "kind": "voice",
                    "text": "MP3 변환 확인",
                    "audio_filename": source.name,
                    "status": "ready",
                },
            ],
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["ffmpeg_used"] is True
    assert body["audio_url"].endswith(".mp3")
    for key, suffix in (("audio_url", ".mp3"), ("srt_url", ".srt"), ("vtt_url", ".vtt")):
        filename = body[key].rsplit("/", 1)[-1]
        path = store.resolve(filename)
        assert path is not None
        assert path.suffix == suffix
        assert path.stat().st_size > 0


def test_final_export_removes_partial_outputs_on_format_mismatch(client):
    store = client.app.state.audio_store
    first = store.output_path(uuid4(), "wav")
    second = store.output_path(uuid4(), "wav")
    _write_wave(first, 0.1, sample_rate=8000)
    _write_wave(second, 0.1, sample_rate=16000)
    before = {path.name for path in store.root.iterdir()}

    response = client.post(
        "/api/v1/exports",
        json={
            "segments": [
                {
                    "kind": "voice",
                    "text": "첫째",
                    "audio_filename": first.name,
                    "status": "ready",
                },
                {
                    "kind": "voice",
                    "text": "둘째",
                    "audio_filename": second.name,
                    "status": "ready",
                },
            ],
        },
    )

    assert response.status_code == 422
    assert {path.name for path in store.root.iterdir()} == before
    assert not list(store.root.glob(".*.part.*"))
