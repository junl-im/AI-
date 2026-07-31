import json
from pathlib import Path
from time import perf_counter
from uuid import uuid4

from fastapi import APIRouter, Request

from app.engines.registry import engine_registry
from app.schemas.quality import (
    EvaluationSentence,
    QualityCompareRequest,
    QualityCompareResponse,
    QualityDiagnosticsResponse,
    QualityResult,
    TextPreviewRequest,
    TextPreviewResponse,
)
from app.schemas.tts import TtsSynthesisRequest
from app.services.engine_diagnostics import quality_diagnostics

router = APIRouter()
_DATA_FILE = Path(__file__).parents[2] / "data" / "korean_tts_sentences.json"


def _absolute_audio_url(request: Request, audio_url: str | None) -> str | None:
    if audio_url and audio_url.startswith("/"):
        return f"{str(request.base_url).rstrip('/')}{audio_url}"
    return audio_url


@router.get("/diagnostics", response_model=QualityDiagnosticsResponse)
async def diagnostics() -> QualityDiagnosticsResponse:
    return quality_diagnostics("0.7.1", engine_registry.list_tts())


@router.get("/sentences", response_model=list[EvaluationSentence])
async def evaluation_sentences() -> list[EvaluationSentence]:
    payload = json.loads(_DATA_FILE.read_text(encoding="utf-8"))
    return [EvaluationSentence.model_validate(item) for item in payload]


@router.post("/text-preview", response_model=TextPreviewResponse)
async def text_preview(payload: TextPreviewRequest, request: Request) -> TextPreviewResponse:
    pipeline = request.app.state.tts_pipeline
    normalized, changes, segments = pipeline.preview(payload.text)
    if payload.max_chars != pipeline.max_segment_chars:
        from app.services.text_segmenter import split_korean_text

        segments = split_korean_text(normalized, payload.max_chars)
    return TextPreviewResponse(
        original_text=payload.text,
        normalized_text=normalized,
        changes=changes,
        segments=segments,
        segment_count=len(segments),
    )


@router.post("/compare", response_model=QualityCompareResponse)
async def compare_engines(
    payload: QualityCompareRequest,
    request: Request,
) -> QualityCompareResponse:
    pipeline = request.app.state.tts_pipeline
    manager = request.app.state.job_manager
    normalized, changes, _ = pipeline.preview(payload.text)
    results: list[QualityResult] = []

    for engine_id in dict.fromkeys(payload.engine_ids):
        engine = engine_registry.get_tts(engine_id)
        if engine is None:
            results.append(QualityResult(
                engine_id=engine_id,
                engine_name=engine_id,
                engine_mode="mock",
                status="missing",
                audio_url=None,
                message="등록되지 않은 엔진입니다.",
            ))
            continue
        info = engine.info()
        if not info.ready:
            results.append(QualityResult(
                engine_id=info.id,
                engine_name=info.name,
                engine_mode=info.mode,
                status="unavailable",
                audio_url=None,
                message=info.reason or "현재 환경에서 사용할 수 없습니다.",
            ))
            continue

        job_id = uuid4()
        synthesis = TtsSynthesisRequest(
            text=payload.text,
            voice_id=payload.voice_id,
            emotion=payload.emotion,
            speed=payload.speed,
            pitch=payload.pitch,
            output_format="wav",
            engine_id=engine_id,
            job_id=job_id,
        )
        started = perf_counter()
        try:
            result = await manager.run(
                str(job_id),
                lambda engine=engine, synthesis=synthesis: pipeline.synthesize(engine, synthesis),
            )
            elapsed_ms = result.processing_ms or round((perf_counter() - started) * 1000)
            results.append(QualityResult(
                engine_id=info.id,
                engine_name=info.name,
                engine_mode=info.mode,
                status=result.status,
                audio_url=_absolute_audio_url(request, result.audio_url),
                message=result.message,
                elapsed_ms=elapsed_ms,
                duration_seconds=result.estimated_duration_seconds,
                realtime_factor=result.realtime_factor,
                file_size_bytes=result.file_size_bytes,
                segment_count=result.segment_count,
            ))
        except Exception as error:
            results.append(QualityResult(
                engine_id=info.id,
                engine_name=info.name,
                engine_mode=info.mode,
                status="failed",
                audio_url=None,
                message=str(error) or "품질 비교 생성에 실패했습니다.",
            ))

    return QualityCompareResponse(
        normalized_text=normalized,
        changes=changes,
        results=results,
    )
