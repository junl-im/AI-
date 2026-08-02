from datetime import datetime, timezone

from fastapi import APIRouter, Query, Request

from app.schemas.evidence import (
    ExportSoakRecordRequest,
    ExportSoakRecordResponse,
    ExportSoakSummaryResponse,
    QualityEvidenceBundleResponse,
    QualityEvidenceSummaryResponse,
    SttComparisonSummaryResponse,
    SttRegenerationComparisonRequest,
    SttRegenerationComparisonResponse,
)
from app.services.evidence_metrics import (
    build_export_soak_record,
    build_stt_comparison,
    summarize_export_soak,
    summarize_stt_comparisons,
)

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
    return QualityEvidenceSummaryResponse(
        stt=summarize_stt_comparisons(_stt_records(request)),
        export_soak=summarize_export_soak(_soak_records(request)),
    )


@router.get("/evidence-bundle", response_model=QualityEvidenceBundleResponse)
async def evidence_bundle(
    request: Request,
    include_sensitive: bool = Query(default=False),
) -> QualityEvidenceBundleResponse:
    devices = request.app.state.device_benchmark_store.list(limit=1000)
    stt = request.app.state.stt_comparison_store.list(limit=1000)
    soak = request.app.state.export_soak_store.list(limit=1000)
    if not include_sensitive:
        devices = [
            {**item, "device_name": item.get("device_profile", "redacted"), "notes": ""}
            for item in devices
        ]
        soak = [{**item, "notes": ""} for item in soak]
    summary = QualityEvidenceSummaryResponse(
        stt=summarize_stt_comparisons([
            SttRegenerationComparisonResponse.model_validate(item) for item in stt
        ]),
        export_soak=summarize_export_soak([
            ExportSoakRecordResponse.model_validate(item) for item in soak
        ]),
    )
    return QualityEvidenceBundleResponse(
        schema_version="1",
        app_version=request.app.version,
        exported_at=datetime.now(timezone.utc),
        redacted=not include_sensitive,
        device_benchmarks=devices,
        stt_regeneration_comparisons=stt,
        export_soak_records=soak,
        summary=summary,
    )
