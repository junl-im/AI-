import time
from pathlib import Path
from urllib.parse import urlparse
from uuid import UUID, uuid4

from app.engines.base import TtsEngine
from app.schemas.tts import TtsSynthesisRequest, TtsSynthesisResponse
from app.services.text_normalizer import normalize_korean_text
from app.services.text_segmenter import split_korean_text
from app.services.wav_tools import merge_wav_files, wav_duration_seconds
from app.storage.audio_store import AudioStore


class TtsPipeline:
    def __init__(self, store: AudioStore, max_segment_chars: int = 180) -> None:
        self.store = store
        self.max_segment_chars = max_segment_chars

    async def synthesize(
        self,
        engine: TtsEngine,
        request: TtsSynthesisRequest,
    ) -> TtsSynthesisResponse:
        started = time.perf_counter()
        normalization = normalize_korean_text(request.text)
        segments = split_korean_text(normalization.normalized, self.max_segment_chars)
        parent_id = request.job_id or uuid4()
        normalized_request = request.model_copy(
            update={"text": normalization.normalized, "job_id": parent_id}
        )

        if len(segments) <= 1 or engine.info().mode == "mock":
            result = await engine.synthesize(normalized_request)
            return self._enrich(result, normalization.normalized, len(segments), started)

        paths: list[Path] = []
        try:
            first_result: TtsSynthesisResponse | None = None
            for segment in segments:
                child_id = uuid4()
                child_request = normalized_request.model_copy(
                    update={"text": segment, "job_id": child_id}
                )
                child_result = await engine.synthesize(child_request)
                if child_result.audio_url is None:
                    raise RuntimeError("분할 음성 결과에 WAV 주소가 없습니다.")
                path = self._path_from_audio_url(child_result.audio_url)
                if path is None:
                    raise RuntimeError("분할 음성 WAV를 임시 저장소에서 찾지 못했습니다.")
                paths.append(path)
                if first_result is None:
                    first_result = child_result

            assert first_result is not None
            output = self.store.output_path(UUID(str(parent_id)), "wav")
            duration = merge_wav_files(paths, output)
            elapsed_ms = round((time.perf_counter() - started) * 1000)
            return TtsSynthesisResponse(
                job_id=str(parent_id),
                status="completed",
                engine_id=first_result.engine_id,
                engine_mode=first_result.engine_mode,
                audio_url=f"/api/v1/audio/{output.name}",
                estimated_duration_seconds=round(duration, 1),
                message=f"긴 문장을 {len(segments)}개 구간으로 나눠 하나의 WAV로 연결했습니다.",
                normalized_text=normalization.normalized,
                segment_count=len(segments),
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
    def _realtime_factor(elapsed_ms: int, duration_seconds: float) -> float | None:
        if duration_seconds <= 0:
            return None
        return round((elapsed_ms / 1000) / duration_seconds, 3)
