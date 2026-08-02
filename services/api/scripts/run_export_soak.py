import argparse
import json
from pathlib import Path

from app.schemas.evidence import ExportSoakRecordResponse
from app.services.evidence_metrics import build_export_soak_record
from app.services.export_soak import run_export_soak_scenario
from app.services.quality_evidence_store import QualityEvidenceStore


def main() -> int:
    parser = argparse.ArgumentParser(description="SoriON 장문 Export soak 검증")
    parser.add_argument("--minutes", nargs="+", type=int, default=[10, 30, 60])
    parser.add_argument("--formats", nargs="+", choices=["wav", "mp3"], default=["wav", "mp3"])
    parser.add_argument("--segment-seconds", type=int, default=60)
    parser.add_argument("--sample-rate", type=int, default=8000)
    parser.add_argument("--work-dir", type=Path, default=Path(".sorion/quality/export-soak-audio"))
    parser.add_argument("--output", type=Path, default=Path(".sorion/quality/export-soak.jsonl"))
    parser.add_argument("--keep-artifacts", action="store_true")
    args = parser.parse_args()
    if any(value not in {10, 30, 60} for value in args.minutes):
        parser.error("공식 soak 시나리오는 10, 30, 60분만 허용합니다.")
    if args.segment_seconds < 1 or args.sample_rate < 1000:
        parser.error("segment-seconds와 sample-rate 값을 확인하세요.")

    store = QualityEvidenceStore(args.output.resolve())
    failed = False
    for minutes in args.minutes:
        for output_format in args.formats:
            payload = run_export_soak_scenario(
                args.work_dir.resolve(),
                minutes,
                output_format,
                segment_seconds=args.segment_seconds,
                sample_rate=args.sample_rate,
                keep_artifacts=args.keep_artifacts,
            )
            response: ExportSoakRecordResponse = build_export_soak_record(payload)
            store.append(response.model_dump(mode="json"))
            print(json.dumps(response.model_dump(mode="json"), ensure_ascii=False))
            failed = failed or response.status == "failed"
    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
