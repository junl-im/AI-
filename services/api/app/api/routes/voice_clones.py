import json
from datetime import datetime, timezone
from typing import Annotated
from uuid import UUID, uuid4

from fastapi import APIRouter, File, Form, HTTPException, Request, UploadFile, status
from pydantic import ValidationError

from app.engines.registry import engine_registry
from app.schemas.voiceclone import (
    VoiceCloneCapabilityResponse,
    VoiceCloneClientAnalysis,
    VoiceCloneConsent,
    VoiceCloneDeleteResponse,
    VoiceCloneProfileResponse,
)
from app.storage.voice_clone_store import ALLOWED_EXTENSIONS

router = APIRouter()


def parse_consent(value: str) -> VoiceCloneConsent:
    try:
        consent = VoiceCloneConsent.model_validate(json.loads(value))
    except (json.JSONDecodeError, ValidationError) as error:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="SOA-5005: 유효한 음성 복제 동의 기록이 필요합니다.",
        ) from error
    if not (
        consent.rights_confirmed
        and consent.disclosure_confirmed
        and consent.prohibited_use_confirmed
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="SOA-5001: 권한·AI 고지·금지 용도 확인이 모두 필요합니다.",
        )
    return consent


def parse_client_analysis(value: str) -> VoiceCloneClientAnalysis:
    try:
        return VoiceCloneClientAnalysis.model_validate(json.loads(value))
    except (json.JSONDecodeError, ValidationError) as error:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="SOA-5006: 음성 샘플 분석 결과가 올바르지 않습니다.",
        ) from error


@router.get("/capabilities", response_model=VoiceCloneCapabilityResponse)
async def capabilities(request: Request) -> VoiceCloneCapabilityResponse:
    engine = engine_registry.resolve_voice_clone("auto")
    if engine is not None:
        await engine.probe()
    info = engine.info() if engine else None
    settings = request.app.state.settings
    return VoiceCloneCapabilityResponse(
        engine_id=info.id if info else "cosyvoice3-worker",
        engine_name=info.name if info else "Fun-CosyVoice 3 Worker",
        ready=info.ready if info else False,
        reason=info.reason if info else "음성 복제 엔진이 등록되지 않았습니다.",
        max_file_bytes=settings.voice_clone_max_file_bytes,
        accepted_extensions=sorted(ALLOWED_EXTENSIONS),
    )


@router.post("/profiles", response_model=VoiceCloneProfileResponse)
async def create_profile(
    request: Request,
    sample: Annotated[UploadFile, File()],
    display_name: Annotated[str, Form(min_length=1, max_length=40)],
    consent_json: Annotated[str, Form()],
    client_analysis_json: Annotated[str, Form()],
) -> VoiceCloneProfileResponse:
    consent = parse_consent(consent_json)
    analysis = parse_client_analysis(client_analysis_json)
    if analysis.status == "blocked":
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="SOA-5007: 품질 검사에서 차단된 샘플은 복제 준비에 사용할 수 없습니다.",
        )

    profile_id = uuid4()
    store = request.app.state.voice_clone_store
    try:
        sample_path = await store.save_sample(profile_id, sample)
    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail=str(error),
        ) from error

    try:
        server_analysis = store.inspect_sample(sample_path)
    except ValueError as error:
        store.delete_profile(profile_id)
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail=str(error),
        ) from error
    duration = server_analysis["duration_seconds"]
    if isinstance(duration, float) and duration < 5:
        store.delete_profile(profile_id)
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="SOA-5009: WAV 음성 샘플은 최소 5초 이상이어야 합니다.",
        )

    created_at = datetime.now(timezone.utc).isoformat()
    engine = engine_registry.resolve_voice_clone("auto")
    info = engine.info() if engine else None
    engine_id = info.id if info else "cosyvoice3-worker"
    engine_ready = bool(info and info.ready)
    profile_status = "sample-ready" if engine_ready else "engine-unavailable"
    ready_message = (
        "동의된 샘플을 안전하게 보관했습니다. "
        "Worker가 준비되어 실제 복제 작업을 시작할 수 있습니다."
    )
    waiting_message = (
        "동의된 샘플을 안전하게 보관했습니다. "
        "CosyVoice Worker 연결 전까지 복제는 실행하지 않습니다."
    )
    message = ready_message if engine_ready else waiting_message
    store.save_metadata(
        profile_id,
        {
            "id": str(profile_id),
            "display_name": display_name.strip(),
            "engine_id": engine_id,
            "sample_file": sample_path.name,
            "created_at": created_at,
            "consent": consent.model_dump(mode="json"),
            "client_analysis": analysis.model_dump(mode="json"),
            "server_analysis": server_analysis,
        },
    )
    return VoiceCloneProfileResponse(
        id=str(profile_id),
        display_name=display_name.strip(),
        status=profile_status,
        engine_id=engine_id,
        sample_file_name=sample_path.name,
        created_at=created_at,
        message=message,
    )


@router.delete("/profiles/{profile_id}", response_model=VoiceCloneDeleteResponse)
def delete_profile(profile_id: UUID, request: Request) -> VoiceCloneDeleteResponse:
    deleted = request.app.state.voice_clone_store.delete_profile(profile_id)
    return VoiceCloneDeleteResponse(
        id=str(profile_id),
        deleted=deleted,
        message=(
            "저장된 샘플과 동의 기록을 삭제했습니다."
            if deleted
            else "삭제할 음성 샘플을 찾지 못했습니다."
        ),
    )
