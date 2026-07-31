import json
from collections.abc import AsyncIterator
from datetime import datetime, timezone
from typing import Annotated
from uuid import UUID, uuid4

from fastapi import (
    APIRouter,
    File,
    Form,
    HTTPException,
    Request,
    Response,
    UploadFile,
    status,
)
from fastapi.responses import StreamingResponse
from pydantic import ValidationError

from app.engines.registry import engine_registry
from app.engines.voiceclone.cosyvoice_worker import WorkerClientError
from app.schemas.voiceclone import (
    VoiceCloneCapabilityResponse,
    VoiceCloneClientAnalysis,
    VoiceCloneConsent,
    VoiceCloneDeleteResponse,
    VoiceCloneJobCreateRequest,
    VoiceCloneJobResponse,
    VoiceCloneProfileResponse,
    VoiceCloneWorkerResponse,
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


def get_clone_engine():
    engine = engine_registry.resolve_voice_clone("auto")
    if engine is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="SOA-5100: 음성 복제 Worker가 등록되지 않았습니다.",
        )
    return engine


def worker_error(error: WorkerClientError) -> HTTPException:
    code = error.status_code if 400 <= error.status_code < 600 else 502
    return HTTPException(status_code=code, detail=f"SOA-5101: {error}")


def map_job_payload(payload: dict[str, object]) -> VoiceCloneJobResponse:
    job_id = str(payload.get("id") or "")
    mapped = dict(payload)
    mapped["audio_url"] = (
        f"/api/v1/voice-clones/jobs/{job_id}/audio"
        if payload.get("audio_url")
        else None
    )
    mapped["events_url"] = f"/api/v1/voice-clones/jobs/{job_id}/events"
    segments = []
    raw_segments = payload.get("segments")
    if isinstance(raw_segments, list):
        for value in raw_segments:
            if not isinstance(value, dict):
                continue
            segment = dict(value)
            index = segment.get("index")
            segment["audio_url"] = (
                f"/api/v1/voice-clones/jobs/{job_id}/segments/{index}/audio"
                if segment.get("audio_url")
                else None
            )
            segments.append(segment)
    mapped["segments"] = segments
    return VoiceCloneJobResponse.model_validate(mapped)


@router.get("/capabilities", response_model=VoiceCloneCapabilityResponse)
async def capabilities(request: Request) -> VoiceCloneCapabilityResponse:
    engine = engine_registry.resolve_voice_clone("auto")
    if engine is not None:
        await engine.probe()
    info = engine.info() if engine else None
    snapshot = engine.probe_snapshot() if engine else {}
    settings = request.app.state.settings
    return VoiceCloneCapabilityResponse(
        engine_id=info.id if info else "cosyvoice3-worker",
        engine_name=info.name if info else "Fun-CosyVoice 3 Worker",
        ready=info.ready if info else False,
        reason=info.reason if info else "음성 복제 엔진이 등록되지 않았습니다.",
        max_file_bytes=settings.voice_clone_max_file_bytes,
        accepted_extensions=sorted(ALLOWED_EXTENSIONS),
        worker_version=snapshot.get("worker_version"),
        diagnostics=snapshot.get("diagnostics"),
    )


@router.get("/worker", response_model=VoiceCloneWorkerResponse)
async def worker_status() -> VoiceCloneWorkerResponse:
    engine = get_clone_engine()
    await engine.probe()
    snapshot = engine.probe_snapshot()
    return VoiceCloneWorkerResponse(
        ready=bool(snapshot.get("ready")),
        reason=str(snapshot.get("reason") or "Worker 상태를 확인하지 못했습니다."),
        worker_version=(
            str(snapshot["worker_version"])
            if snapshot.get("worker_version") is not None
            else None
        ),
        latency_ms=(
            int(snapshot["latency_ms"])
            if snapshot.get("latency_ms") is not None
            else None
        ),
        diagnostics=(
            snapshot["diagnostics"]
            if isinstance(snapshot.get("diagnostics"), dict)
            else None
        ),
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
    if engine is not None:
        await engine.probe()
    info = engine.info() if engine else None
    engine_id = info.id if info else "cosyvoice3-worker"
    engine_ready = bool(info and info.ready)
    profile_status = "engine-ready" if engine_ready else "engine-unavailable"
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


@router.post(
    "/profiles/{profile_id}/jobs",
    response_model=VoiceCloneJobResponse,
    status_code=status.HTTP_202_ACCEPTED,
)
async def create_clone_job(
    profile_id: UUID,
    payload: VoiceCloneJobCreateRequest,
    request: Request,
) -> VoiceCloneJobResponse:
    sample_path = request.app.state.voice_clone_store.sample_path(profile_id)
    if sample_path is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="SOA-5102: 동의된 음성 프로필을 찾지 못했습니다.",
        )
    engine = get_clone_engine()
    if not await engine.probe():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"SOA-5103: {engine.info().reason}",
        )
    try:
        result = await engine.create_job(str(profile_id), payload.text.strip(), sample_path)
    except WorkerClientError as error:
        raise worker_error(error) from error
    return map_job_payload(result)


@router.get("/jobs/{job_id}", response_model=VoiceCloneJobResponse)
async def get_clone_job(job_id: UUID) -> VoiceCloneJobResponse:
    try:
        result = await get_clone_engine().get_job(str(job_id))
    except WorkerClientError as error:
        raise worker_error(error) from error
    return map_job_payload(result)


@router.post("/jobs/{job_id}/cancel", response_model=VoiceCloneJobResponse)
async def cancel_clone_job(job_id: UUID) -> VoiceCloneJobResponse:
    try:
        result = await get_clone_engine().cancel_job(str(job_id))
    except WorkerClientError as error:
        raise worker_error(error) from error
    return map_job_payload(result)


@router.post("/jobs/{job_id}/retry", response_model=VoiceCloneJobResponse)
async def retry_clone_job(job_id: UUID) -> VoiceCloneJobResponse:
    try:
        result = await get_clone_engine().retry_job(str(job_id))
    except WorkerClientError as error:
        raise worker_error(error) from error
    return map_job_payload(result)


@router.get("/jobs/{job_id}/events")
async def clone_job_events(job_id: UUID) -> StreamingResponse:
    engine = get_clone_engine()

    async def stream() -> AsyncIterator[bytes]:
        try:
            async for chunk in engine.stream_events(str(job_id)):
                yield chunk
        except WorkerClientError as error:
            payload = json.dumps({"detail": str(error)}, ensure_ascii=False)
            yield f"event: error\ndata: {payload}\n\n".encode()

    return StreamingResponse(
        stream(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@router.get("/jobs/{job_id}/audio")
async def clone_job_audio(job_id: UUID) -> Response:
    try:
        content = await get_clone_engine().download_audio(str(job_id))
    except WorkerClientError as error:
        raise worker_error(error) from error
    return Response(
        content=content,
        media_type="audio/wav",
        headers={
            "Content-Disposition": f'attachment; filename="sorion-clone-{job_id}.wav"'
        },
    )


@router.get("/jobs/{job_id}/segments/{segment_index}/audio")
async def clone_segment_audio(job_id: UUID, segment_index: int) -> Response:
    try:
        content = await get_clone_engine().download_audio(str(job_id), segment_index)
    except WorkerClientError as error:
        raise worker_error(error) from error
    return Response(content=content, media_type="audio/wav")


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
