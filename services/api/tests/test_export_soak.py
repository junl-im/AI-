from app.services.evidence_metrics import build_export_soak_record
from app.services.export_soak import run_export_soak_scenario


def test_one_minute_wav_soak_has_no_subtitle_drift(tmp_path):
    payload = run_export_soak_scenario(
        tmp_path,
        1,
        "wav",
        segment_seconds=15,
        sample_rate=2000,
    )
    record = build_export_soak_record(payload)

    assert record.status == "ready"
    assert record.segment_count == 4
    assert record.actual_duration_seconds == 60
    assert record.subtitle_drift_ms == 0
    assert not list(tmp_path.glob("*"))
