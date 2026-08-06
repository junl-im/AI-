import json
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, Query, Request
from fastapi.responses import Response

from app.api.routes.verification import _benchmark_summary, _worker_telemetry_summary
from app.schemas.evidence import (
    EvidenceIntakeImportResponse,
    EvidenceIntakePreviewResponse,
    EvidenceIntakeRecordResponse,
    EvidenceIntakeRequest,
    ExportSoakRecordRequest,
    ExportSoakRecordResponse,
    ExportSoakSummaryResponse,
    QualityEvidenceBundleResponse,
    QualityEvidenceManifest,
    QualityEvidenceSummaryResponse,
    QualityEvidenceVerificationResponse,
    SttComparisonSummaryResponse,
    SttRegenerationComparisonRequest,
    SttRegenerationComparisonResponse,
)
from app.schemas.privacy_audit import (
    PrivacyAuditBundleResponse,
    PrivacyAuditVerificationResponse,
)
from app.schemas.verification import (
    DeviceBenchmarkResponse,
    WorkerSynthesisTelemetryResponse,
)
from app.services.evidence_bundle import (
    EVIDENCE_BUNDLE_SCHEMA_VERSION,
    build_bundle_manifest,
    verify_bundle_payload,
)
from app.services.evidence_metrics import (
    build_export_soak_record,
    build_stt_comparison,
    summarize_export_soak,
    summarize_stt_comparisons,
)
from app.services.privacy_audit_bundle import (
    build_privacy_audit_bundle,
    build_privacy_audit_zip,
    verify_privacy_audit_bundle,
)
from app.services.voice_preset_approval import VoicePresetApprovalError
from app.services.web_quality_report import verify_web_quality_report

router = APIRouter()


def _stt_records(request: Request) -> list[SttRegenerationComparisonResponse]:
    return [
        SttRegenerationComparisonResponse.model_validate(item)
        for item in request.app.state.stt_comparison_store.list()
    ]


def _soak_records(request: Request) -> list[ExportSoakRecordResponse]:
    return [
        ExportSoakRecordResponse.model_validate(item)
        for item in request.app.state.export_soak_store.list()
    ]


def _redacted_records(
    request: Request,
    *,
    include_sensitive: bool,
) -> tuple[
    list[dict[str, object]],
    list[dict[str, object]],
    list[dict[str, object]],
]:
    devices = request.app.state.device_benchmark_store.list(limit=1000)
    stt = request.app.state.stt_comparison_store.list(limit=1000)
    soak = request.app.state.export_soak_store.list(limit=1000)
    if not include_sensitive:
        devices = [
            {
                **item,
                "device_name": item.get("device_profile", "redacted"),
                "browser_version": "",
                "notes": "",
            }
            for item in devices
        ]
        soak = [{**item, "notes": ""} for item in soak]
    return devices, stt, soak


def _base_summary(
    stt: list[dict[str, object]],
    soak: list[dict[str, object]],
) -> QualityEvidenceSummaryResponse:
    return QualityEvidenceSummaryResponse(
        stt=summarize_stt_comparisons([
            SttRegenerationComparisonResponse.model_validate(item) for item in stt
        ]),
        export_soak=summarize_export_soak([
            ExportSoakRecordResponse.model_validate(item) for item in soak
        ]),
    )


def _bundle_parts(
    request: Request,
    *,
    include_sensitive: bool,
) -> tuple[
    list[dict[str, object]],
    list[dict[str, object]],
    list[dict[str, object]],
    QualityEvidenceSummaryResponse,
    QualityEvidenceManifest,
]:
    devices, stt, soak = _redacted_records(
        request,
        include_sensitive=include_sensitive,
    )
    summary = _base_summary(stt, soak)
    manifest = QualityEvidenceManifest.model_validate(build_bundle_manifest(
        app_version=request.app.version,
        redacted=not include_sensitive,
        categories={
            "device_benchmarks": devices,
            "stt_regeneration_comparisons": stt,
            "export_soak_records": soak,
        },
        summary=summary.model_dump(mode="json"),
    ))
    return devices, stt, soak, summary, manifest


@router.post(
    "/stt/regeneration-comparisons",
    response_model=SttRegenerationComparisonResponse,
)
async def record_stt_comparison(
    payload: SttRegenerationComparisonRequest,
    request: Request,
) -> SttRegenerationComparisonResponse:
    response = build_stt_comparison(payload)
    request.app.state.stt_comparison_store.append(response.model_dump(mode="json"))
    return response


@router.get(
    "/stt/regeneration-comparisons/summary",
    response_model=SttComparisonSummaryResponse,
)
async def stt_comparison_summary(request: Request) -> SttComparisonSummaryResponse:
    return summarize_stt_comparisons(_stt_records(request))


@router.post("/export-soak-records", response_model=ExportSoakRecordResponse)
async def record_export_soak(
    payload: ExportSoakRecordRequest,
    request: Request,
) -> ExportSoakRecordResponse:
    response = build_export_soak_record(payload)
    request.app.state.export_soak_store.append(response.model_dump(mode="json"))
    return response


@router.get(
    "/export-soak-records/summary",
    response_model=ExportSoakSummaryResponse,
)
async def export_soak_summary(request: Request) -> ExportSoakSummaryResponse:
    return summarize_export_soak(_soak_records(request))


@router.get("/evidence-summary", response_model=QualityEvidenceSummaryResponse)
async def evidence_summary(request: Request) -> QualityEvidenceSummaryResponse:
    _, _, _, summary, manifest = _bundle_parts(
        request,
        include_sensitive=False,
    )
    return summary.model_copy(update={"manifest": manifest})


@router.get("/evidence-bundle", response_model=QualityEvidenceBundleResponse)
async def evidence_bundle(
    request: Request,
    include_sensitive: bool = Query(default=False),
) -> QualityEvidenceBundleResponse:
    devices, stt, soak, summary, manifest = _bundle_parts(
        request,
        include_sensitive=include_sensitive,
    )
    return QualityEvidenceBundleResponse(
        schema_version=EVIDENCE_BUNDLE_SCHEMA_VERSION,
        app_version=request.app.version,
        exported_at=datetime.now(timezone.utc),
        redacted=not include_sensitive,
        device_benchmarks=devices,
        stt_regeneration_comparisons=stt,
        export_soak_records=soak,
        summary=summary,
        manifest=manifest,
    )


@router.post(
    "/evidence-bundle/verify",
    response_model=QualityEvidenceVerificationResponse,
)
async def verify_evidence_bundle(
    payload: dict[str, object],
) -> QualityEvidenceVerificationResponse:
    return QualityEvidenceVerificationResponse.model_validate(
        verify_bundle_payload(payload)
    )


def _privacy_audit_payload(request: Request) -> dict[str, object]:
    approval_history = [
        item.model_dump(mode="json")
        for item in request.app.state.voice_preset_approval_service.list_history(500)
    ]
    try:
        renewal_queue = request.app.state.voice_preset_approval_service.renewal_queue(60)
        renewal_payload: dict[str, object] | None = renewal_queue.model_dump(mode="json")
    except VoicePresetApprovalError:
        renewal_payload = None
    worker_items = [
        WorkerSynthesisTelemetryResponse.model_validate(item)
        for item in request.app.state.worker_telemetry_store.list(limit=5000)
    ]
    device_items = [
        DeviceBenchmarkResponse.model_validate(item)
        for item in request.app.state.device_benchmark_store.list(limit=1000)
    ]
    worker_summary = _worker_telemetry_summary(worker_items).model_dump(mode="json")
    device_summary = _benchmark_summary(device_items).model_dump(mode="json")
    return build_privacy_audit_bundle(
        app_version=request.app.version,
        exported_at=datetime.now(timezone.utc),
        approval_history=approval_history,
        renewal_queue=renewal_payload,
        worker_groups=worker_summary.get("metric_groups", []),
        device_summary=device_summary,
    )


@router.get("/privacy-audit-bundle", response_model=PrivacyAuditBundleResponse)
async def privacy_audit_bundle(request: Request) -> PrivacyAuditBundleResponse:
    return PrivacyAuditBundleResponse.model_validate(_privacy_audit_payload(request))


@router.get("/privacy-audit-bundle.zip")
async def privacy_audit_zip(request: Request) -> Response:
    payload = _privacy_audit_payload(request)
    archive, bundle_sha256, record_count = build_privacy_audit_zip(payload)
    filename = f"sorion-privacy-audit-{bundle_sha256[:12]}.zip"
    return Response(
        content=archive,
        media_type="application/zip",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "X-SoriON-Bundle-SHA256": bundle_sha256,
            "X-SoriON-Record-Count": str(record_count),
            "Cache-Control": "no-store",
        },
    )


@router.post(
    "/privacy-audit-bundle/verify",
    response_model=PrivacyAuditVerificationResponse,
)
async def verify_privacy_audit(
    payload: dict[str, object],
) -> PrivacyAuditVerificationResponse:
    return PrivacyAuditVerificationResponse.model_validate(
        verify_privacy_audit_bundle(payload)
    )


def _current_record_sha256s(request: Request) -> set[str]:
    _, _, _, _, manifest = _bundle_parts(request, include_sensitive=False)
    current = {item.sha256 for item in manifest.records}
    current.update(request.app.state.evidence_intake_store.record_sha256s())
    return current


def _intake_preview(payload: EvidenceIntakeRequest, request: Request) -> dict[str, object]:
    serialized_size = len(json.dumps(payload.bundle, ensure_ascii=False).encode())
    if serialized_size > 5 * 1024 * 1024:
        return {
            "valid": False,
            "importable": False,
            "duplicate_bundle": False,
            "duplicate_record_count": 0,
            "bundle_sha256": None,
            "schema_version": None,
            "app_version": None,
            "record_count": 0,
            "reason": "증거 JSON은 5MiB 이하여야 합니다.",
        }

    if "reportSha256" in payload.bundle or "schemaVersion" in payload.bundle:
        verification = verify_web_quality_report(payload.bundle)
        bundle_sha256 = str(verification["bundle_sha256"])
        record_sha256s = [str(item) for item in verification["record_sha256s"]]
        schema_version = str(verification["schema_version"])
        app_version = str(verification["app_version"])
        record_count = int(verification["record_count"])
    else:
        bundle_verification = verify_bundle_payload(payload.bundle)
        verification = {
            "valid": bundle_verification["valid"],
            "reason": bundle_verification["reason"],
        }
        manifest = payload.bundle.get("manifest")
        if isinstance(manifest, dict):
            bundle_sha256 = str(manifest.get("bundle_sha256", ""))
            record_sha256s = [
                str(item.get("sha256"))
                for item in manifest.get("records", [])
                if isinstance(item, dict) and item.get("sha256")
            ]
        else:
            bundle_sha256 = str(bundle_verification.get("expected_sha256") or "")
            record_sha256s = []
        schema_version = str(payload.bundle.get("schema_version", ""))
        app_version = str(payload.bundle.get("app_version", ""))
        record_count = int(bundle_verification.get("record_count", 0))

    if not verification["valid"]:
        return {
            "valid": False,
            "importable": False,
            "duplicate_bundle": False,
            "duplicate_record_count": 0,
            "bundle_sha256": bundle_sha256 or None,
            "schema_version": schema_version or None,
            "app_version": app_version or None,
            "record_count": record_count,
            "reason": str(verification["reason"]),
        }

    duplicate_bundle = bundle_sha256 in request.app.state.evidence_intake_store.bundle_sha256s()
    existing_records = _current_record_sha256s(request)
    duplicate_record_count = sum(1 for digest in record_sha256s if digest in existing_records)
    importable = not duplicate_bundle and duplicate_record_count == 0
    reason = "가져올 수 있습니다."
    if duplicate_bundle:
        reason = "이미 등록된 증거 묶음입니다."
    elif duplicate_record_count:
        reason = f"이미 등록된 레코드 {duplicate_record_count}건이 포함돼 있습니다."
    return {
        "valid": True,
        "importable": importable,
        "duplicate_bundle": duplicate_bundle,
        "duplicate_record_count": duplicate_record_count,
        "bundle_sha256": bundle_sha256,
        "schema_version": schema_version,
        "app_version": app_version,
        "record_count": record_count,
        "reason": reason,
        "record_sha256s": record_sha256s,
    }


@router.post("/evidence-intake/preview", response_model=EvidenceIntakePreviewResponse)
async def preview_evidence_intake(
    payload: EvidenceIntakeRequest,
    request: Request,
) -> EvidenceIntakePreviewResponse:
    return EvidenceIntakePreviewResponse.model_validate(_intake_preview(payload, request))


@router.post("/evidence-intake/import", response_model=EvidenceIntakeImportResponse)
async def import_evidence_bundle(
    payload: EvidenceIntakeRequest,
    request: Request,
) -> EvidenceIntakeImportResponse:
    preview = _intake_preview(payload, request)
    if not preview["valid"]:
        raise HTTPException(status_code=422, detail=preview["reason"])
    if not preview["importable"]:
        raise HTTPException(status_code=409, detail=preview["reason"])
    record_sha256s = [str(item) for item in preview.get("record_sha256s", [])]
    try:
        record = request.app.state.evidence_intake_store.append_bundle(
            bundle=payload.bundle,
            source=payload.source.model_dump(mode="json"),
            bundle_sha256=str(preview["bundle_sha256"]),
            record_sha256s=record_sha256s,
        )
    except FileExistsError as error:
        raise HTTPException(status_code=409, detail="이미 등록된 증거 묶음입니다.") from error
    except ValueError as error:
        raise HTTPException(
            status_code=409,
            detail="이미 등록된 증거 레코드가 포함돼 있습니다.",
        ) from error
    return EvidenceIntakeImportResponse(
        imported=True,
        record=EvidenceIntakeRecordResponse.model_validate(record),
        reason="증거 묶음을 등록했습니다.",
    )


@router.get("/evidence-intake", response_model=list[EvidenceIntakeRecordResponse])
async def list_evidence_intake(request: Request) -> list[EvidenceIntakeRecordResponse]:
    return [
        EvidenceIntakeRecordResponse.model_validate(item)
        for item in request.app.state.evidence_intake_store.list()
    ]
