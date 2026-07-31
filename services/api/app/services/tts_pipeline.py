import time
from collections.abc import Awaitable, Callable
from pathlib import Path
from urllib.parse import urlparse
from uuid import UUID, uuid4

from app.engines.base import TtsEngine
from app.schemas.tts import JobPhase, TtsSynthesisRequest, TtsSynthesisResponse
from app.services.text_normalizer import normalize_korean_text
from app.services.text_segmenter import split_korean_text
from app.services.wav_tools import merge_wav_files, wav_duration_seconds
from app.storage.audio_store import AudioStore

ProgressReporter = Callable[[JobPhase, int, int, int, str], Awaitable[None]]


class TtsPipeline:
    def __init__(self, store: AudioStore, max_segment_chars: int = 180) -> None:
        self.store = store
        self.max_segment_chars = max_segment_chars

    async def synthesize(
        self,
        engine: TtsEngine,
        request: TtsSynthesisRequest,
        progress: ProgressReporter | None = None,
    ) -> TtsSynthesisResponse:
        started = time.perf_counter()
        await self._report(
            progress,
            "normalizing",
            7,
            0,
            0,
            "숫자와 날짜를 한국어 발음에 맞게 정리합니다.",
        )
        normalization = normalize_korean_text(request.text)
        segments = split_korean_text(normalization.normalized, self.max_segment_chars)
        total_segments = max(1, len(segments))
        parent_id = request.job_id or uuid4()
        normalized_request = request.model_copy(
            update={"text": normalization.normalized, "job_id": parent_id}
        )

        if len(segments) <= 1 or engine.info().mode == "mock":
            await self._report(
                progress,
                "generating",
                35,
                1,
                total_segments,
                "음성 엔진이 문장을 읽고 있습니다.",
            )
            result = await engine.synthesize(normalized_request)
            await self._report(
                progress,
                "generating",
                92,
                total_segments,
                total_segments,
                "생성 결과를 확인하고 있습니다.",
            )
            return self._enrich(result, normalization.normalized, total_segments, started)

        paths: list[Path] = []
        try:
            first_result: TtsSynthesisResponse | None = None
            for index, segment in enumerate(segments, start=1):
                start_progress = 12 + round(((index - 1) / total_segments) * 70)
                await self._report(
                    progress,
                    "generating",
                    start_progress,
                    index,
                    total_segments,
                    f"{total_segments}개 중 {index}번째 구간을 생성하고 있습니다.",
                )
                child_id = uuid4()
                child_request = normalized_request.model_copy(
                    update={"text": segment, "job_id": child_id}
                )
                child_result = await engine.synthesize(child_request)
                if child_result.audio_url is None:
                    raise RuntimeError(f"{index}번째 구간 결과에 WAV 주소가 없습니다.")
                path = self._path_from_audio_url(child_result.audio_url)
                if path is None:
                    raise RuntimeError(f"{index}번째 구간 WAV를 임시 저장소에서 찾지 못했습니다.")
                paths.append(path)
                if first_result is None:
                    first_result = child_result

            assert first_result is not None
            await self._report(
                progress,
                "merging",
                88,
                total_segments,
                total_segments,
                "분할 음성을 하나의 WAV로 연결합니다.",
            )
            output = self.store.output_path(UUID(str(parent_id)), "wav")
            duration = merge_wav_files(paths, output)
            elapsed_ms = round((time.perf_counter() - started) * 1000)
            await self._report(
                progress,
                "merging",
                96,
                total_segments,
                total_segments,
                "최종 WAV 파일을 점검합니다.",
            )
            return TtsSynthesisResponse(
                job_id=str(parent_id),
                status="completed",
                engine_id=first_result.engine_id,
                engine_mode=first_result.engine_mode,
                audio_url=f"/api/v1/audio/{output.name}",
                estimated_duration_seconds=round(duration, 1),
                message=f"긴 문장을 {total_segments}개 구간으로 나눠 하나의 WAV로 연결했습니다.",
                normalized_text=normalization.normalized,
                segment_count=total_segments,
                processing_ms=elapsed_ms,
                file_size_bytes=output.stat().st_size,
                realtime_factor=self._realtime_factor(elapsed_ms, duration),
            )
        finally:
            for path in paths:
                self.store.remove(path)

    def preview(self, text: str) -> tuple[str, list[str], list[str]]:
        normalization = normalize_korean_text(text)
        segments = split_korean_text(normalization.normalized, self.max_segment_chars)
        return normalization.normalized, normalization.changes, segments

    def _enrich(
        self,
        result: TtsSynthesisResponse,
        normalized_text: str,
        segment_count: int,
        started: float,
    ) -> TtsSynthesisResponse:
        elapsed_ms = round((time.perf_counter() - started) * 1000)
        path = self._path_from_audio_url(result.audio_url) if result.audio_url else None
        duration = result.estimated_duration_seconds
        if path is not None:
            duration = wav_duration_seconds(path)
        return result.model_copy(
            update={
                "normalized_text": normalized_text,
                "segment_count": max(1, segment_count),
                "processing_ms": elapsed_ms,
                "file_size_bytes": path.stat().st_size if path is not None else None,
                "realtime_factor": self._realtime_factor(elapsed_ms, duration),
                "estimated_duration_seconds": round(duration, 1),
            }
        )

    def _path_from_audio_url(self, audio_url: str) -> Path | None:
        filename = Path(urlparse(audio_url).path).name
        return self.store.resolve(filename)

    @staticmethod
    async def _report(
        reporter: ProgressReporter | None,
        phase: JobPhase,
        progress: int,
        current_segment: int,
        total_segments: int,
        message: str,
    ) -> None:
        if reporter is not None:
            await reporter(phase, progress, current_segment, total_segments, message)

    @staticmethod
    def _realtime_factor(elapsed_ms: int, duration_seconds: float) -> float | None:
        if duration_seconds <= 0:
            return None
        return round((elapsed_ms / 1000) / duration_seconds, 3)
