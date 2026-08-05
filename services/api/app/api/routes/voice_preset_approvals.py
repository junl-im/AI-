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
from app.services.voice_review_operator import (
    VoiceReviewOperatorAuthorizationError,
    VoiceReviewOperatorPrincipal,
    authorize_voice_review_operator,
)

router = APIRouter()


def _principal(request: Request) -> VoiceReviewOperatorPrincipal:
    try:
        return authorize_voice_review_operator(request, request.app.state.settings)
    except VoiceReviewOperatorAuthorizationError as error:
        request.app.state.audit_logger.write(
            event="voice-review-authorization-denied",
            method=request.method,
            path=request.url.path,
            status_code=error.status_code,
            request_id=getattr(request.state, "request_id", "unknown"),
            actor=getattr(request.state, "actor", "unknown"),
        )
        raise HTTPException(
            status_code=error.status_code,
            detail=f"{error.code}: {error}",
        ) from error


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
    _principal(request)
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
    principal = _principal(request)
    try:
        record, manifest = request.app.state.voice_preset_approval_service.apply(
            payload,
            principal.actor,
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
    _principal(request)
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
    principal = _principal(request)
    try:
        record, manifest = request.app.state.voice_preset_approval_service.rollback(
            approval_id,
            payload.confirmation,
            payload.reason,
            principal.actor,
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
