def test_stt_regeneration_comparison_records_improvement(client):
    response = client.post(
        "/api/v1/quality/stt/regeneration-comparisons",
        json={
            "segment_id": "segment-1",
            "reference_text": "결제 금액은 38,500원입니다.",
            "before_transcript": "결제 금액은 35,800원입니다.",
            "after_transcript": "결제 금액은 38,500원입니다.",
            "model_id": "small",
            "device_profile": "cuda",
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["improved"] is True
    assert body["passed_after"] is True
    assert body["critical_error_improvement"] == 1

    summary = client.get(
        "/api/v1/quality/stt/regeneration-comparisons/summary"
    ).json()
    assert summary["total_records"] == 1
    assert summary["improved_records"] == 1


def test_export_soak_summary_tracks_required_scenarios(client):
    response = client.post(
        "/api/v1/quality/export-soak-records",
        json={
            "sample_minutes": 10,
            "output_format": "wav",
            "segment_count": 10,
            "expected_duration_seconds": 600,
            "actual_duration_seconds": 600,
            "processing_seconds": 2,
            "output_bytes": 1000,
            "subtitle_end_seconds": 600,
            "succeeded": True,
        },
    )

    assert response.status_code == 200
    assert response.json()["status"] == "ready"
    summary = client.get("/api/v1/quality/export-soak-records/summary").json()
    assert summary["total_records"] == 1
    assert "10m:wav" not in summary["missing_scenarios"]
    assert "60m:mp3" in summary["missing_scenarios"]


def test_evidence_bundle_redacts_device_name_and_notes(client):
    client.post(
        "/api/v1/quality/device-benchmarks",
        json={
            "device_profile": "cpu",
            "device_name": "Developer Personal Computer",
            "engine_id": "cosyvoice3",
            "model_id": "local",
            "model_version": "1",
            "sample_minutes": 10,
            "processing_seconds": 60,
            "audio_duration_seconds": 120,
            "succeeded": True,
            "notes": "private path",
        },
    )

    response = client.get("/api/v1/quality/evidence-bundle")

    assert response.status_code == 200
    body = response.json()
    assert body["redacted"] is True
    assert body["device_benchmarks"][0]["device_name"] == "cpu"
    assert body["device_benchmarks"][0]["notes"] == ""


def test_evidence_bundle_has_stable_manifest_and_verifies(client):
    client.post(
        "/api/v1/quality/device-benchmarks",
        json={
            "device_profile": "android",
            "device_name": "Pixel Private Alias",
            "engine_id": "cosyvoice3",
            "model_id": "local",
            "model_version": "1",
            "preset_id": "on-clear",
            "sample_minutes": 10,
            "soak_elapsed_seconds": 605,
            "scenario": "baseline",
            "browser_version": "Chrome full version",
            "processing_seconds": 60,
            "audio_duration_seconds": 120,
            "playback_completed": True,
            "succeeded": True,
            "notes": "private device note",
        },
    )

    first = client.get("/api/v1/quality/evidence-bundle").json()
    second = client.get("/api/v1/quality/evidence-bundle").json()

    assert first["schema_version"] == "2"
    assert first["manifest"]["record_count"] == 1
    assert len(first["manifest"]["bundle_sha256"]) == 64
    assert first["manifest"]["bundle_sha256"] == second["manifest"]["bundle_sha256"]
    assert first["device_benchmarks"][0]["device_name"] == "android"
    assert first["device_benchmarks"][0]["browser_version"] == ""
    assert first["device_benchmarks"][0]["notes"] == ""

    verified = client.post(
        "/api/v1/quality/evidence-bundle/verify",
        json=first,
    )
    assert verified.status_code == 200
    assert verified.json() == {
        "valid": True,
        "provided_sha256": first["manifest"]["bundle_sha256"],
        "expected_sha256": first["manifest"]["bundle_sha256"],
        "record_count": 1,
        "reason": "검증 통과",
    }


def test_evidence_bundle_verifier_rejects_tampered_record(client):
    client.post(
        "/api/v1/quality/export-soak-records",
        json={
            "sample_minutes": 10,
            "output_format": "wav",
            "segment_count": 10,
            "expected_duration_seconds": 600,
            "actual_duration_seconds": 600,
            "processing_seconds": 2,
            "output_bytes": 1000,
            "subtitle_end_seconds": 600,
            "succeeded": True,
        },
    )
    bundle = client.get("/api/v1/quality/evidence-bundle").json()
    bundle["export_soak_records"][0]["actual_duration_seconds"] = 599

    response = client.post(
        "/api/v1/quality/evidence-bundle/verify",
        json=bundle,
    )

    assert response.status_code == 200
    assert response.json()["valid"] is False
    assert response.json()["provided_sha256"] != response.json()["expected_sha256"]


def test_evidence_summary_exposes_redacted_manifest(client):
    response = client.get("/api/v1/quality/evidence-summary")

    assert response.status_code == 200
    manifest = response.json()["manifest"]
    assert manifest["schema_version"] == "2"
    assert manifest["record_count"] == 0
    assert len(manifest["bundle_sha256"]) == 64


def test_evidence_bundle_verifier_rejects_unknown_fields(client):
    bundle = client.get("/api/v1/quality/evidence-bundle").json()
    bundle["unexpected_note"] = "not covered by the manifest"

    response = client.post(
        "/api/v1/quality/evidence-bundle/verify",
        json=bundle,
    )

    assert response.status_code == 200
    assert response.json()["valid"] is False
    assert "허용되지 않은 필드" in response.json()["reason"]


def test_evidence_intake_previews_imports_and_blocks_duplicate_bundle(client):
    bundle = client.get("/api/v1/quality/evidence-bundle").json()
    payload = {
        "bundle": bundle,
        "source": {
            "name": "web-quality-evidence.json",
            "kind": "github-actions",
            "commit_sha": "abc123",
            "run_id": "run-77",
        },
    }

    preview = client.post("/api/v1/quality/evidence-intake/preview", json=payload)
    assert preview.status_code == 200
    assert preview.json()["valid"] is True
    assert preview.json()["importable"] is True

    imported = client.post("/api/v1/quality/evidence-intake/import", json=payload)
    assert imported.status_code == 200
    body = imported.json()
    assert body["imported"] is True
    assert body["record"]["source_kind"] == "github-actions"
    assert body["record"]["commit_sha"] == "abc123"

    duplicate = client.post("/api/v1/quality/evidence-intake/preview", json=payload)
    assert duplicate.status_code == 200
    assert duplicate.json()["duplicate_bundle"] is True
    assert duplicate.json()["importable"] is False

    conflict = client.post("/api/v1/quality/evidence-intake/import", json=payload)
    assert conflict.status_code == 409

    listed = client.get("/api/v1/quality/evidence-intake")
    assert listed.status_code == 200
    assert listed.json()[0]["bundle_sha256"] == bundle["manifest"]["bundle_sha256"]


def test_evidence_intake_rejects_tampered_and_local_duplicate_records(client):
    client.post(
        "/api/v1/quality/export-soak-records",
        json={
            "sample_minutes": 10,
            "output_format": "wav",
            "segment_count": 10,
            "expected_duration_seconds": 600,
            "actual_duration_seconds": 600,
            "processing_seconds": 2,
            "output_bytes": 1000,
            "subtitle_end_seconds": 600,
            "succeeded": True,
        },
    )
    bundle = client.get("/api/v1/quality/evidence-bundle").json()
    payload = {"bundle": bundle, "source": {"name": "device.json", "kind": "device"}}

    duplicate = client.post("/api/v1/quality/evidence-intake/preview", json=payload)
    assert duplicate.status_code == 200
    assert duplicate.json()["duplicate_record_count"] == 1
    assert duplicate.json()["importable"] is False

    bundle["export_soak_records"][0]["actual_duration_seconds"] = 599
    tampered = client.post(
        "/api/v1/quality/evidence-intake/preview",
        json={"bundle": bundle, "source": {"name": "tampered.json", "kind": "manual"}},
    )
    assert tampered.status_code == 200
    assert tampered.json()["valid"] is False
    assert tampered.json()["importable"] is False



def test_evidence_intake_accepts_verified_web_quality_report(client):
    from app.services.web_quality_report import _evidence_payload, _sha256

    phase_specs = [
        ("lock-structure", "npm run locks:check -- --component npm"),
        ("web-toolchain", "npm run quality:web-toolchain"),
        ("dependency-tree", "npm run quality:dependency-tree"),
        ("lint", "npm run lint"),
        ("typecheck", "npm run typecheck"),
        ("test", "npm run test:ci"),
        ("build", "npm run build"),
    ]
    report = {
        "schemaVersion": 1,
        "mode": "run",
        "appVersion": "0.10.5",
        "heartbeat": "6.7",
        "startedAt": "2026-08-03T09:00:00.000Z",
        "completedAt": "2026-08-03T09:01:00.000Z",
        "runtime": {
            "node": "22.18.0",
            "npm": "10.9.3",
            "platform": "linux",
            "architecture": "x64",
        },
        "source": {
            "repository": "example/sorion",
            "commitSha": "abc123",
            "runId": "77",
            "runAttempt": "1",
        },
        "inputs": {
            "packageJsonSha256": "1" * 64,
            "packageLockSha256": "2" * 64,
        },
        "phases": [
            {
                "id": phase_id,
                "label": phase_id,
                "command": command,
                "status": "passed",
                "exitCode": 0,
                "durationMs": 100,
                "logSha256": f"{index:x}" * 64,
            }
            for index, (phase_id, command) in enumerate(phase_specs, start=3)
        ],
        "dist": [{"path": "dist/index.html", "bytes": 100, "sha256": "a" * 64}],
        "passed": True,
    }
    report["evidenceSha256"] = _sha256(_evidence_payload(report))
    report["reportSha256"] = _sha256(report)
    payload = {
        "bundle": report,
        "source": {
            "name": "web-quality-report.json",
            "kind": "github-actions",
            "commit_sha": "abc123",
            "run_id": "77",
        },
    }

    preview = client.post("/api/v1/quality/evidence-intake/preview", json=payload)
    assert preview.status_code == 200
    assert preview.json()["valid"] is True
    assert preview.json()["schema_version"] == "web-quality/1"
    assert preview.json()["record_count"] == 1

    imported = client.post("/api/v1/quality/evidence-intake/import", json=payload)
    assert imported.status_code == 200
    assert imported.json()["record"]["source_kind"] == "github-actions"

    report["phases"][3]["status"] = "failed"
    tampered = client.post(
        "/api/v1/quality/evidence-intake/preview",
        json={"bundle": report, "source": {"name": "tampered-report.json"}},
    )
    assert tampered.status_code == 200
    assert tampered.json()["valid"] is False


def test_privacy_audit_bundle_redacts_people_gpu_and_verifies(client):
    import json

    service = client.app.state.voice_preset_approval_service
    service.history_path.write_text(
        json.dumps({
            "record": {
                "approval_id": "approval-private-1",
                "event": "approved",
                "voice_id": "sori-warm",
                "actor": "ip:127.0.0.1;user:private-user",
                "reviewer": "Private Reviewer",
                "at": "2026-08-06T00:00:00+00:00",
                "audio_sha256": "a" * 64,
                "before_manifest_sha256": "b" * 64,
                "after_manifest_sha256": "c" * 64,
                "review_bundle_sha256": "d" * 64,
                "signature_mode": "hmac-sha256",
                "signing_key_id": "active-key",
                "signed_payload_sha256": "e" * 64,
                "signature": "secret-looking-signature",
            },
            "before_manifest": {},
            "after_manifest": {},
        }) + "\n",
        encoding="utf-8",
    )
    client.app.state.worker_telemetry_store.append({
        "id": "audit-telemetry",
        "recorded_at": "2026-08-06T00:00:00+00:00",
        "engine_id": "cosyvoice3",
        "worker_job_id": "worker-private",
        "preset_id": "sori-warm",
        "model_id": "cosyvoice3",
        "model_version": "1",
        "model_digest": "sha256:model",
        "device_profile": "cuda",
        "accelerator_name": "cuda:0",
        "gpu_name": "Private Workstation GPU",
        "first_audio_ms": 500,
        "processing_ms": 1000,
        "audio_duration_seconds": 4.0,
        "realtime_factor": 0.25,
        "final_handoff_error_ms": 20,
        "succeeded": True,
        "failure_reason": "",
    })

    response = client.get("/api/v1/quality/privacy-audit-bundle")
    assert response.status_code == 200
    bundle = response.json()
    serialized = json.dumps(bundle, ensure_ascii=False)
    assert bundle["schema_version"] == "privacy-audit/1"
    assert bundle["redacted"] is True
    assert "Private Reviewer" not in serialized
    assert "private-user" not in serialized
    assert "Private Workstation GPU" not in serialized
    assert "secret-looking-signature" not in serialized
    assert bundle["approval_history"][0]["voice_id"] == "sori-warm"
    assert len(bundle["benchmark_regressions"][0]["hardware_fingerprint_sha256"]) == 64

    verified = client.post(
        "/api/v1/quality/privacy-audit-bundle/verify",
        json=bundle,
    )
    assert verified.status_code == 200
    assert verified.json()["valid"] is True


def test_privacy_audit_verifier_rejects_tampering(client):
    bundle = client.get("/api/v1/quality/privacy-audit-bundle").json()
    bundle["trust_rotation"]["trusted_key_count"] = 999

    response = client.post(
        "/api/v1/quality/privacy-audit-bundle/verify",
        json=bundle,
    )

    assert response.status_code == 200
    assert response.json()["valid"] is False


def test_privacy_audit_zip_contains_verified_redacted_bundle(client):
    import io
    import json
    import zipfile

    response = client.get("/api/v1/quality/privacy-audit-bundle.zip")

    assert response.status_code == 200
    assert response.headers["content-type"] == "application/zip"
    assert len(response.headers["x-sorion-bundle-sha256"]) == 64
    with zipfile.ZipFile(io.BytesIO(response.content)) as archive:
        assert sorted(archive.namelist()) == ["MANIFEST.json", "README.txt", "audit.json"]
        audit = json.loads(archive.read("audit.json"))
        manifest = json.loads(archive.read("MANIFEST.json"))
    verification = client.post(
        "/api/v1/quality/privacy-audit-bundle/verify",
        json=audit,
    )
    assert verification.status_code == 200
    assert verification.json()["valid"] is True
    assert manifest["bundle_sha256"] == response.headers["x-sorion-bundle-sha256"]
    assert manifest["record_count"] == int(response.headers["x-sorion-record-count"])
    assert "\"signature\"" not in json.dumps(audit)
