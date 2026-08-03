from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, HTTPException, Request, status

from app.schemas.export import FinalExportRequest, FinalExportResponse
from app.services.final_export import ExportInput, create_final_export

router = APIRouter()


def _asset_url(request: Request, filename: str) -> str:
    base = str(request.base_url).rstrip("/")
    return f"{base}/api/v1/audio/{filename}"


@router.post("", response_model=FinalExportResponse)
async def final_export(
    payload: FinalExportRequest,
    request: Request,
) -> FinalExportResponse:
    incomplete = [
        item for item in payload.segments
        if item.kind == "voice" and item.status != "ready"
    ]
    if incomplete and not payload.allow_incomplete:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                f"SOA-6301: 완료되지 않은 음성 구간 {len(incomplete)}개가 있어 "
                "최종 Export를 차단했습니다."
            ),
        )

    export_inputs: list[ExportInput] = []
    pending_pause_ms = 0
    for item in payload.segments:
        if item.kind == "pause":
            pending_pause_ms += item.duration_ms
            continue
        if item.status != "ready" or not item.audio_filename:
            continue
        export_inputs.append(ExportInput(
            filename=item.audio_filename,
            text=item.text,
            pause_before_ms=pending_pause_ms,
        ))
        pending_pause_ms = 0
    if pending_pause_ms and export_inputs:
        previous = export_inputs[-1]
        export_inputs[-1] = ExportInput(
            filename=previous.filename,
            text=previous.text,
            pause_before_ms=previous.pause_before_ms,
            pause_after_ms=pending_pause_ms,
        )

    try:
        result = create_final_export(
            request.app.state.audio_store,
            export_inputs,
            payload.output_format,
        )
    except RuntimeError as error:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"SOA-6302: {error}",
        ) from error
    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail=f"SOA-6303: {error}",
        ) from error

    return FinalExportResponse(
        audio_url=_asset_url(request, result.audio_filename),
        srt_url=_asset_url(request, result.srt_filename),
        vtt_url=_asset_url(request, result.vtt_filename),
        output_format=result.output_format,
        duration_seconds=result.duration_seconds,
        ffmpeg_used=result.ffmpeg_used,
        skipped_segments=len(incomplete),
        message=(
            "최종 음원과 실제 시간 기반 자막을 만들었습니다. "
            "서버 파일은 임시이며 보존하려면 내려받아야 합니다."
        ),
        server_expires_at=(
            datetime.now(timezone.utc)
            + timedelta(minutes=request.app.state.settings.audio_ttl_minutes)
        ),
        server_retention_minutes=request.app.state.settings.audio_ttl_minutes,
    )
