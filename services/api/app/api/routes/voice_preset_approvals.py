from fastapi import APIRouter, HTTPException, Query, Request

from app.schemas.voice_preset_approval import (
    VoicePresetApprovalApplyRequest,
    VoicePresetApprovalApplyResponse,
    VoicePresetApprovalInput,
    VoicePresetApprovalPreviewResponse,
    VoicePresetApprovalRecord,
    VoicePresetApprovalRollbackRequest,
    VoicePresetApprovalRollbackResponse,
)
from app.services.voice_preset_approval import VoicePresetApprovalError

router = APIRouter()


def _actor(request: Request) -> str:
    user = request.headers.get("X-SoriON-User-ID", "").strip()
    client = request.headers.get("X-SoriON-Client-ID", "").strip()
    host = request.client.host if request.client else "unknown"
    if user:
        return f"ip:{host};user:{user[:80]}"
    if client:
        return f"ip:{host};client:{client[:80]}"
    return f"ip:{host}"


def _raise(error: VoicePresetApprovalError) -> None:
    raise HTTPException(status_code=409, detail=f"SOA-6810: {error}") from error


@router.post(
    "/voice-preset-approvals/preview",
    response_model=VoicePresetApprovalPreviewResponse,
)
async def preview_voice_preset_approval(
    payload: VoicePresetApprovalInput,
    request: Request,
) -> VoicePresetApprovalPreviewResponse:
    try:
        return request.app.state.voice_preset_approval_service.preview(payload)
    except VoicePresetApprovalError as error:
        _raise(error)


@router.post(
    "/voice-preset-approvals/apply",
    response_model=VoicePresetApprovalApplyResponse,
)
async def apply_voice_preset_approval(
    payload: VoicePresetApprovalApplyRequest,
    request: Request,
) -> VoicePresetApprovalApplyResponse:
    try:
        record, manifest = request.app.state.voice_preset_approval_service.apply(
            payload,
            _actor(request),
        )
    except VoicePresetApprovalError as error:
        _raise(error)
    request.app.state.audit_logger.write(
        event="voice-preset-approved",
        method="POST",
        path="/api/v1/quality/voice-preset-approvals/apply",
        status_code=200,
        request_id=record.approval_id,
        actor=record.actor,
    )
    return VoicePresetApprovalApplyResponse(
        status="approved",
        record=record,
        manifest=manifest,
    )


@router.get(
    "/voice-preset-approvals/history",
    response_model=list[VoicePresetApprovalRecord],
)
async def list_voice_preset_approval_history(
    request: Request,
    limit: int = Query(default=100, ge=1, le=500),
) -> list[VoicePresetApprovalRecord]:
    return request.app.state.voice_preset_approval_service.list_history(limit)


@router.post(
    "/voice-preset-approvals/{approval_id}/rollback",
    response_model=VoicePresetApprovalRollbackResponse,
)
async def rollback_voice_preset_approval(
    approval_id: str,
    payload: VoicePresetApprovalRollbackRequest,
    request: Request,
) -> VoicePresetApprovalRollbackResponse:
    try:
        record, manifest = request.app.state.voice_preset_approval_service.rollback(
            approval_id,
            payload.confirmation,
            payload.reason,
            _actor(request),
        )
    except VoicePresetApprovalError as error:
        _raise(error)
    request.app.state.audit_logger.write(
        event="voice-preset-approval-rolled-back",
        method="POST",
        path=f"/api/v1/quality/voice-preset-approvals/{approval_id}/rollback",
        status_code=200,
        request_id=record.approval_id,
        actor=record.actor,
    )
    return VoicePresetApprovalRollbackResponse(
        status="rolled-back",
        record=record,
        manifest=manifest,
    )
