import wave
from uuid import UUID, uuid4

import pytest

from app.engines.base import TtsEngine
from app.schemas.engine import EngineInfo
from app.schemas.tts import TtsSynthesisRequest, TtsSynthesisResponse
from app.services.tts_pipeline import TtsPipeline
from app.storage.audio_store import AudioStore


class SegmentWaveEngine(TtsEngine):
    def __init__(self, store: AudioStore) -> None:
        self.store = store
        self.seen_texts: list[str] = []

    def info(self) -> EngineInfo:
        return EngineInfo(
            id="segment-test",
            name="Segment Test",
            kind="tts",
            mode="local",
            provider="test",
            languages=["ko-KR"],
            output_formats=["wav"],
            supports_emotion=False,
            supports_speed=True,
            supports_pitch=False,
            supports_voice_clone=False,
            ready=True,
        )

    async def synthesize(self, request: TtsSynthesisRequest) -> TtsSynthesisResponse:
        self.seen_texts.append(request.text)
        job_id = request.job_id or uuid4()
        path = self.store.output_path(UUID(str(job_id)))
        with wave.open(str(path), "wb") as audio:
            audio.setnchannels(1)
            audio.setsampwidth(2)
            audio.setframerate(16000)
            audio.writeframes(b"\x00\x00" * 1600)
        return TtsSynthesisResponse(
            job_id=str(job_id),
            status="completed",
            engine_id="segment-test",
            engine_mode="local",
            audio_url=f"/api/v1/audio/{path.name}",
            estimated_duration_seconds=0.1,
            message="ok",
        )


@pytest.mark.asyncio
async def test_pipeline_normalizes_splits_and_merges_long_text(tmp_path):
    store = AudioStore(tmp_path, ttl_minutes=30)
    engine = SegmentWaveEngine(store)
    pipeline = TtsPipeline(store, max_segment_chars=60)
    parent_id = uuid4()
    text = "2026-08-03에 시작합니다. " + "긴 문장을 안정적으로 나누어 생성합니다. " * 8

    result = await pipeline.synthesize(
        engine,
        TtsSynthesisRequest(text=text, voice_id="sori-warm", job_id=parent_id),
    )

    assert result.segment_count > 1
    assert len(engine.seen_texts) == result.segment_count
    assert result.audio_url == f"/api/v1/audio/{parent_id}.wav"
    assert result.file_size_bytes and result.file_size_bytes > 44
    assert result.processing_ms is not None
    assert "이천이십육년" in (result.normalized_text or "")
    assert all(not path.name.startswith(str(parent_id)) or path.name == f"{parent_id}.wav" for path in tmp_path.iterdir())

@pytest.mark.asyncio
async def test_pipeline_reports_segment_progress(tmp_path):
    store = AudioStore(tmp_path, ttl_minutes=30)
    engine = SegmentWaveEngine(store)
    pipeline = TtsPipeline(store, max_segment_chars=45)
    reports: list[tuple[str, int, int, int]] = []

    async def report(phase, progress, current_segment, total_segments, message):
        assert message
        reports.append((phase, progress, current_segment, total_segments))

    result = await pipeline.synthesize(
        engine,
        TtsSynthesisRequest(
            text="긴 문장의 진행률을 확인합니다. " * 12,
            voice_id="sori-warm",
            job_id=uuid4(),
        ),
        report,
    )

    assert result.segment_count > 1
    assert reports[0][0] == "normalizing"
    assert any(item[0] == "generating" and item[2] == 1 for item in reports)
    assert any(item[0] == "merging" and item[1] >= 88 for item in reports)
