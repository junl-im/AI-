from datetime import datetime, timezone
from uuid import uuid4

from app.schemas.evidence import (
    ExportSoakRecordRequest,
    ExportSoakRecordResponse,
    ExportSoakSummaryResponse,
    SttComparisonSummaryResponse,
    SttRegenerationComparisonRequest,
    SttRegenerationComparisonResponse,
)
from app.schemas.verification import SttMeasurementRequest
from app.services.stt_evaluation import critical_error_count, measure_stt


def build_stt_comparison(
    payload: SttRegenerationComparisonRequest,
) -> SttRegenerationComparisonResponse:
    common = {
        "reference_text": payload.reference_text,
        "engine_id": payload.engine_id,
        "model_id": payload.model_id,
        "device_profile": payload.device_profile,
    }
    before = measure_stt(SttMeasurementRequest(
        **common,
        transcript_text=payload.before_transcript,
        audio_duration_seconds=payload.before_audio_duration_seconds,
        processing_seconds=payload.before_processing_seconds,
    ))
    after = measure_stt(SttMeasurementRequest(
        **common,
        transcript_text=payload.after_transcript,
        audio_duration_seconds=payload.after_audio_duration_seconds,
        processing_seconds=payload.after_processing_seconds,
    ))
    character_improvement = before.character_error_rate - after.character_error_rate
    word_improvement = before.word_error_rate - after.word_error_rate
    critical_improvement = critical_error_count(before) - critical_error_count(after)
    improved = (
        character_improvement > 0
        or word_improvement > 0
        or critical_improvement > 0
    )
    return SttRegenerationComparisonResponse(
        id=str(uuid4()),
        recorded_at=datetime.now(timezone.utc),
        segment_id=payload.segment_id,
        engine_id=payload.engine_id,
        model_id=payload.model_id,
        device_profile=payload.device_profile,
        before=before,
        after=after,
        character_error_improvement=character_improvement,
        word_error_improvement=word_improvement,
        critical_error_improvement=critical_improvement,
        improved=improved,
        passed_after=not after.needs_regeneration,
    )


def summarize_stt_comparisons(
    records: list[SttRegenerationComparisonResponse],
) -> SttComparisonSummaryResponse:
    total = len(records)
    return SttComparisonSummaryResponse(
        total_records=total,
        improved_records=sum(item.improved for item in records),
        passed_after_records=sum(item.passed_after for item in records),
        average_character_error_improvement=(
            sum(item.character_error_improvement for item in records) / total if total else 0
        ),
        average_word_error_improvement=(
            sum(item.word_error_improvement for item in records) / total if total else 0
        ),
        latest_recorded_at=max((item.recorded_at for item in records), default=None),
    )


def build_export_soak_record(
    payload: ExportSoakRecordRequest,
) -> ExportSoakRecordResponse:
    duration_drift_ms = (
        payload.actual_duration_seconds - payload.expected_duration_seconds
    ) * 1000
    subtitle_drift_ms = None
    if payload.subtitle_end_seconds is not None:
        subtitle_drift_ms = (
            payload.subtitle_end_seconds - payload.actual_duration_seconds
        ) * 1000
    realtime_factor = None
    if payload.actual_duration_seconds > 0:
        realtime_factor = payload.processing_seconds / payload.actual_duration_seconds
    drift_tolerance_ms = 250 if payload.output_format == "mp3" else 100
    if not payload.succeeded:
        record_status = "failed"
    elif abs(duration_drift_ms) > drift_tolerance_ms or (
        subtitle_drift_ms is not None
        and abs(subtitle_drift_ms) > drift_tolerance_ms
    ):
        record_status = "failed"
    elif realtime_factor is not None and realtime_factor > 1:
        record_status = "warning"
    else:
        record_status = "ready"
    return ExportSoakRecordResponse(
        **payload.model_dump(),
        id=str(uuid4()),
        recorded_at=datetime.now(timezone.utc),
        realtime_factor=realtime_factor,
        duration_drift_ms=duration_drift_ms,
        subtitle_drift_ms=subtitle_drift_ms,
        status=record_status,
    )


def summarize_export_soak(
    records: list[ExportSoakRecordResponse],
) -> ExportSoakSummaryResponse:
    latest: dict[tuple[int, str], ExportSoakRecordResponse] = {}
    for item in sorted(records, key=lambda value: value.recorded_at):
        latest[(item.sample_minutes, item.output_format)] = item
    coverage = []
    missing = []
    for minutes in (10, 30, 60):
        for output_format in ("wav", "mp3"):
            item = latest.get((minutes, output_format))
            coverage.append({
                "sample_minutes": minutes,
                "output_format": output_format,
                "recorded": item is not None,
                "latest_status": item.status if item else None,
                "latest_realtime_factor": item.realtime_factor if item else None,
                "latest_subtitle_drift_ms": item.subtitle_drift_ms if item else None,
            })
            if item is None:
                missing.append(f"{minutes}m:{output_format}")
    return ExportSoakSummaryResponse(
        total_records=len(records),
        ready_records=sum(item.status == "ready" for item in records),
        warning_records=sum(item.status == "warning" for item in records),
        failed_records=sum(item.status == "failed" for item in records),
        coverage=coverage,
        missing_scenarios=missing,
    )
