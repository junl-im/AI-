from app.schemas.verification import SttMeasurementRequest, SttMeasurementResponse
from app.services.stt_metrics import character_error, critical_token_errors, word_error


def measure_stt(payload: SttMeasurementRequest) -> SttMeasurementResponse:
    character = character_error(payload.reference_text, payload.transcript_text)
    word = word_error(payload.reference_text, payload.transcript_text)
    critical = critical_token_errors(payload.reference_text, payload.transcript_text)
    critical_failed = any(item["error_count"] for item in critical.values())
    realtime_factor = None
    if payload.audio_duration_seconds and payload.processing_seconds:
        realtime_factor = payload.processing_seconds / payload.audio_duration_seconds
    return SttMeasurementResponse(
        **payload.model_dump(),
        character_error_rate=character.rate,
        character_errors=character.distance,
        character_reference_length=character.reference_length,
        word_error_rate=word.rate,
        word_errors=word.distance,
        word_reference_length=word.reference_length,
        critical_tokens=critical,
        realtime_factor=realtime_factor,
        needs_regeneration=character.rate > 0.08 or word.rate > 0.15 or critical_failed,
    )


def regeneration_reasons(
    measurement: SttMeasurementResponse,
    character_threshold: float,
    word_threshold: float,
) -> list[str]:
    reasons: list[str] = []
    if measurement.character_error_rate > character_threshold:
        reasons.append("character_error_rate")
    if measurement.word_error_rate > word_threshold:
        reasons.append("word_error_rate")
    for category, metric in measurement.critical_tokens.items():
        if metric.error_count:
            reasons.append(f"critical_token:{category}")
    return reasons


def critical_error_count(measurement: SttMeasurementResponse) -> int:
    return sum(metric.error_count for metric in measurement.critical_tokens.values())
