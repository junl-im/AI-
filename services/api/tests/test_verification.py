def test_device_benchmark_is_recorded_and_listed(client):
    payload = {
        "device_profile": "cpu",
        "device_name": "Test CPU",
        "engine_id": "cosyvoice3",
        "model_id": "cosyvoice3-local",
        "model_version": "1",
        "sample_minutes": 10,
        "first_audio_ms": 1200,
        "processing_seconds": 60,
        "audio_duration_seconds": 120,
        "retry_count": 0,
        "failure_count": 0,
        "succeeded": True,
    }

    created = client.post("/api/v1/quality/device-benchmarks", json=payload)
    listed = client.get("/api/v1/quality/device-benchmarks")

    assert created.status_code == 200
    assert created.json()["status"] == "ready"
    assert created.json()["realtime_factor"] == 0.5
    assert listed.status_code == 200
    assert listed.json()[0]["device_name"] == "Test CPU"


def test_stt_measurement_marks_critical_error_for_regeneration(client):
    response = client.post(
        "/api/v1/quality/stt/measure",
        json={
            "reference_text": "결제 금액은 38,500원입니다.",
            "transcript_text": "결제 금액은 35,800원입니다.",
            "audio_duration_seconds": 10,
            "processing_seconds": 2,
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["critical_tokens"]["money"]["error_count"] == 1
    assert body["realtime_factor"] == 0.2
    assert body["needs_regeneration"] is True


def test_stt_probe_reports_optional_dependency_state(client):
    response = client.get("/api/v1/quality/stt/probe")

    assert response.status_code == 200
    assert response.json()["engine_id"] == "faster-whisper"


def test_stt_transcribe_rejects_oversized_upload(client):
    class ReadyProbe:
        engine_id = "faster-whisper"
        ready = True
        reason = "ready"

    class ReadyAdapter:
        model_name = "small"
        device = "cpu"
        compute_type = "int8"

        def probe(self):
            return ReadyProbe()

    client.app.state.stt_adapter = ReadyAdapter()
    client.app.state.settings.stt_max_file_bytes = 4

    response = client.post(
        "/api/v1/quality/stt/transcribe",
        data={"reference_text": "테스트"},
        files={"audio": ("sample.wav", b"12345", "audio/wav")},
    )

    assert response.status_code == 413
    assert "크기 제한" in response.json()["detail"]


def test_device_benchmark_summary_reports_missing_scenarios(client):
    payload = {
        "device_profile": "cpu",
        "device_name": "Test CPU",
        "engine_id": "cosyvoice3",
        "model_id": "cosyvoice3-local",
        "model_version": "1",
        "sample_minutes": 10,
        "processing_seconds": 60,
        "audio_duration_seconds": 120,
        "succeeded": True,
    }
    client.post("/api/v1/quality/device-benchmarks", json=payload)

    response = client.get("/api/v1/quality/device-benchmarks/summary")

    assert response.status_code == 200
    body = response.json()
    assert body["total_records"] == 1
    assert body["ready_records"] == 1
    assert "cpu:10m" not in body["missing_scenarios"]
    assert "cuda:10m" in body["missing_scenarios"]


def test_stt_segment_verification_selects_only_failed_segments(client):
    class ReadyProbe:
        engine_id = "faster-whisper"
        ready = True
        reason = "ready"

    class ReadyAdapter:
        model_name = "small"
        device = "cpu"
        compute_type = "int8"

        def probe(self):
            return ReadyProbe()

        def transcribe(self, path):
            if path.name == "good.wav":
                return "결제 금액은 38,500원입니다.", 10.0
            return "결제 금액은 35,800원입니다.", 10.0

    client.app.state.stt_adapter = ReadyAdapter()
    for filename in ["good.wav", "bad.wav"]:
        (client.app.state.settings.audio_path / filename).write_bytes(b"test")

    response = client.post(
        "/api/v1/quality/stt/verify-segments",
        json={
            "segments": [
                {
                    "segment_id": "good",
                    "audio_filename": "good.wav",
                    "reference_text": "결제 금액은 38,500원입니다.",
                },
                {
                    "segment_id": "bad",
                    "audio_filename": "bad.wav",
                    "reference_text": "결제 금액은 38,500원입니다.",
                },
            ],
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["regeneration_segment_ids"] == ["bad"]
    assert body["blocked_segment_ids"] == []
    assert body["results"][0]["needs_regeneration"] is False
    assert body["results"][1]["reasons"] == [
        "character_error_rate",
        "word_error_rate",
        "critical_token:money",
    ]


def test_stt_segment_verification_blocks_attempt_limit(client):
    class ReadyProbe:
        engine_id = "faster-whisper"
        ready = True
        reason = "ready"

    class ReadyAdapter:
        model_name = "small"
        device = "cpu"
        compute_type = "int8"

        def probe(self):
            return ReadyProbe()

        def transcribe(self, path):
            return "완전히 다른 문장", 10.0

    client.app.state.stt_adapter = ReadyAdapter()
    (client.app.state.settings.audio_path / "bad.wav").write_bytes(b"test")

    response = client.post(
        "/api/v1/quality/stt/verify-segments",
        json={
            "max_regeneration_attempts": 2,
            "segments": [
                {
                    "segment_id": "bad",
                    "audio_filename": "bad.wav",
                    "reference_text": "원래 문장 123개",
                    "regeneration_attempts": 2,
                },
            ],
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["regeneration_segment_ids"] == []
    assert body["blocked_segment_ids"] == ["bad"]
    assert body["results"][0]["regeneration_allowed"] is False


def test_mobile_certification_requires_recovery_evidence(client):
    base = {
        "device_profile": "android",
        "device_name": "Pixel Test",
        "engine_id": "cosyvoice3",
        "model_id": "cosyvoice3-local",
        "model_version": "1",
        "sample_minutes": 10,
        "scenario": "network-switch",
        "processing_seconds": 60,
        "audio_duration_seconds": 120,
        "playback_completed": True,
        "succeeded": True,
    }
    warning = client.post(
        "/api/v1/quality/device-benchmarks",
        json=base,
    )
    failed = client.post(
        "/api/v1/quality/device-benchmarks",
        json={**base, "sse_reconnected": False, "audio_fetch_recovered": True},
    )
    ready = client.post(
        "/api/v1/quality/device-benchmarks",
        json={
            **base,
            "preset_id": "on-clear",
            "model_digest": "sha256:test-model",
            "accelerator_name": "cuda",
            "gpu_name": "RTX Test",
            "soak_elapsed_seconds": 605,
            "sse_reconnected": True,
            "audio_fetch_recovered": True,
            "sse_reconnect_ms": 900,
            "audio_fetch_recovery_ms": 1200,
            "playback_interruption_ms": 650,
            "seam_p95_waited_ms": 850,
            "seam_p95_decode_ms": 140,
        },
    )

    assert warning.json()["status"] == "warning"
    assert failed.json()["status"] == "failed"
    assert ready.json()["status"] == "ready"

    summary = client.get("/api/v1/quality/device-benchmarks/summary").json()
    row = next(
        item for item in summary["certification_coverage"]
        if item["profile"] == "android"
        and item["scenario"] == "network-switch"
        and item["sample_minutes"] == 10
    )
    assert row["recorded"] is True
    assert row["latest_status"] == "ready"
    assert "android:network-switch:10m" not in summary["missing_certifications"]
    metrics = next(
        item for item in summary["metric_groups"]
        if item["device_profile"] == "android"
        and item["engine_id"] == "cosyvoice3"
        and item["preset_id"] == "on-clear"
    )
    assert metrics["records"] == 1
    assert metrics["model_digest"] == "sha256:test-model"
    assert metrics["accelerator_name"] == "cuda"
    assert metrics["gpu_name"] == "RTX Test"
    assert metrics["p95_sse_reconnect_ms"] == 900
    assert metrics["p95_audio_fetch_recovery_ms"] == 1200
    assert metrics["p95_playback_interruption_ms"] == 650
    assert metrics["p95_seam_waited_ms"] == 850
    assert metrics["p95_seam_decode_ms"] == 140
    assert metrics["p95_final_handoff_error_ms"] is None


def test_mobile_certification_warns_when_recovery_timings_are_missing(client):
    response = client.post(
        "/api/v1/quality/device-benchmarks",
        json={
            "device_profile": "ios",
            "device_name": "iPhone Test",
            "engine_id": "cosyvoice3",
            "model_id": "cosyvoice3-local",
            "model_version": "1",
            "preset_id": "sori-warm",
            "sample_minutes": 10,
            "scenario": "background-resume",
            "processing_seconds": 60,
            "audio_duration_seconds": 120,
            "playback_completed": True,
            "sse_reconnected": True,
            "audio_fetch_recovered": True,
            "succeeded": True,
        },
    )

    assert response.status_code == 200
    assert response.json()["status"] == "warning"


def test_device_soak_warns_when_wall_clock_is_shorter_than_target(client):
    response = client.post(
        "/api/v1/quality/device-benchmarks",
        json={
            "device_profile": "android",
            "device_name": "Pixel Short Soak",
            "engine_id": "cosyvoice3",
            "model_id": "cosyvoice3-local",
            "model_version": "1",
            "preset_id": "min-energetic",
            "sample_minutes": 10,
            "soak_elapsed_seconds": 300,
            "processing_seconds": 300,
            "audio_duration_seconds": 300,
            "playback_completed": True,
            "succeeded": True,
        },
    )

    assert response.status_code == 200
    assert response.json()["status"] == "warning"


def test_worker_telemetry_summary_separates_model_digest_and_reports_percentiles(client):
    store = client.app.state.worker_telemetry_store
    base = {
        "engine_id": "cosyvoice3",
        "worker_job_id": "worker-1",
        "preset_id": "on-clear",
        "model_id": "cosyvoice3",
        "model_version": "1",
        "model_digest": "sha256:model-a",
        "device_profile": "cuda",
        "accelerator_name": "cuda:0",
        "gpu_name": "RTX Test",
        "processing_ms": 2000,
        "audio_duration_seconds": 4.0,
        "succeeded": True,
        "failure_reason": "",
    }
    for index, first_audio in enumerate([500, 900, 1500], start=1):
        store.append({
            **base,
            "id": f"telemetry-{index}",
            "recorded_at": f"2026-08-05T0{index}:00:00+00:00",
            "worker_job_id": f"worker-{index}",
            "first_audio_ms": first_audio,
            "realtime_factor": [0.4, 0.5, 0.8][index - 1],
            "final_handoff_error_ms": [20, 40, 80][index - 1],
        })
    store.append({
        **base,
        "id": "telemetry-other-model",
        "recorded_at": "2026-08-05T04:00:00+00:00",
        "worker_job_id": "worker-other",
        "model_digest": "sha256:model-b",
        "first_audio_ms": 300,
        "realtime_factor": 0.3,
        "final_handoff_error_ms": 10,
    })

    response = client.get("/api/v1/quality/worker-telemetry/summary")

    assert response.status_code == 200
    body = response.json()
    assert body["total_records"] == 4
    assert len(body["metric_groups"]) == 2
    group = next(item for item in body["metric_groups"] if item["model_digest"] == "sha256:model-a")
    assert group["records"] == 3
    assert group["p50_first_audio_ms"] == 900
    assert group["p95_first_audio_ms"] == 1500
    assert group["p50_realtime_factor"] == 0.5
    assert group["p95_realtime_factor"] == 0.8
    assert group["p50_final_handoff_error_ms"] == 40
    assert group["p95_final_handoff_error_ms"] == 80


def test_worker_telemetry_regression_requires_non_overlapping_windows(client):
    store = client.app.state.worker_telemetry_store
    base = {
        "engine_id": "cosyvoice3",
        "preset_id": "sori-warm",
        "model_id": "cosyvoice3",
        "model_version": "1",
        "model_digest": "sha256:baseline-model",
        "device_profile": "cuda",
        "accelerator_name": "cuda:0",
        "gpu_name": "Private GPU Name",
        "processing_ms": 1000,
        "audio_duration_seconds": 4.0,
        "succeeded": True,
        "failure_reason": "",
    }
    for index in range(9):
        store.append({
            **base,
            "id": f"baseline-{index}",
            "worker_job_id": f"job-{index}",
            "recorded_at": f"2026-08-05T{index:02d}:00:00+00:00",
            "first_audio_ms": 400,
            "realtime_factor": 0.3,
            "final_handoff_error_ms": 20,
        })

    summary = client.get("/api/v1/quality/worker-telemetry/summary").json()
    group = summary["metric_groups"][0]
    assert group["regression"]["status"] == "insufficient"
    assert group["regression"]["minimum_records"] == 10
    assert group["regression"]["available_records"] == 9


def test_worker_telemetry_detects_multi_metric_regression(client):
    store = client.app.state.worker_telemetry_store
    base = {
        "engine_id": "cosyvoice3",
        "preset_id": "on-clear",
        "model_id": "cosyvoice3",
        "model_version": "1",
        "model_digest": "sha256:regression-model",
        "device_profile": "cuda",
        "accelerator_name": "cuda:0",
        "gpu_name": "Private GPU Name",
        "processing_ms": 1000,
        "audio_duration_seconds": 4.0,
        "failure_reason": "",
    }
    for index in range(10):
        recent = index >= 5
        store.append({
            **base,
            "id": f"regression-{index}",
            "worker_job_id": f"regression-job-{index}",
            "recorded_at": f"2026-08-05T{index:02d}:00:00+00:00",
            "first_audio_ms": 1200 if recent else 400,
            "realtime_factor": 0.9 if recent else 0.3,
            "final_handoff_error_ms": 160 if recent else 20,
            "succeeded": not (recent and index == 9),
        })

    summary = client.get("/api/v1/quality/worker-telemetry/summary").json()
    group = summary["metric_groups"][0]
    assessment = group["regression"]
    assert assessment["status"] == "regressed"
    assert assessment["baseline"]["records"] == 5
    assert assessment["current"]["records"] == 5
    assert len(assessment["reasons"]) >= 2


def test_operator_baseline_can_be_confirmed_compared_and_retired(client):
    store = client.app.state.worker_telemetry_store
    base = {
        "engine_id": "cosyvoice3",
        "preset_id": "sori-warm",
        "model_id": "cosyvoice3",
        "model_version": "1",
        "model_digest": "sha256:operator-model",
        "device_profile": "cuda",
        "accelerator_name": "cuda:0",
        "gpu_name": "Private GPU Name",
        "processing_ms": 1000,
        "audio_duration_seconds": 4.0,
        "failure_reason": "",
    }
    for index in range(5):
        store.append({
            **base,
            "id": f"operator-base-{index}",
            "worker_job_id": f"operator-base-job-{index}",
            "recorded_at": f"2026-08-05T{index:02d}:00:00+00:00",
            "first_audio_ms": 400,
            "realtime_factor": 0.3,
            "final_handoff_error_ms": 20,
            "succeeded": True,
        })

    created = client.post(
        "/api/v1/quality/worker-telemetry/operator-baselines",
        json={
            **{
                key: base[key]
                for key in (
                    "engine_id",
                    "preset_id",
                    "model_id",
                    "model_version",
                    "model_digest",
                    "device_profile",
                    "accelerator_name",
                    "gpu_name",
                )
            },
            "confirmation": "현재 성능 기준선 확정",
            "note": "release candidate",
        },
    )

    assert created.status_code == 200
    baseline = created.json()
    assert baseline["source_records"] == 5
    assert len(baseline["source_records_sha256"]) == 64

    for index in range(5, 10):
        store.append({
            **base,
            "id": f"operator-current-{index}",
            "worker_job_id": f"operator-current-job-{index}",
            "recorded_at": f"2026-08-05T{index:02d}:00:00+00:00",
            "first_audio_ms": 1200,
            "realtime_factor": 0.9,
            "final_handoff_error_ms": 160,
            "succeeded": index != 9,
        })

    summary = client.get("/api/v1/quality/worker-telemetry/summary")
    assert summary.status_code == 200
    group = summary.json()["metric_groups"][0]
    assert group["operator_baseline"]["baseline_id"] == baseline["baseline_id"]
    assert group["operator_regression"]["status"] == "regressed"

    retired = client.post(
        f"/api/v1/quality/worker-telemetry/operator-baselines/{baseline['baseline_id']}/retire",
        json={
            "confirmation": "운영자 기준선 폐기",
            "reason": "new model rollout",
        },
    )
    assert retired.status_code == 200
    assert client.get(
        "/api/v1/quality/worker-telemetry/operator-baselines"
    ).json() == []


def test_operator_baseline_history_preview_and_restore_are_append_only(client):
    store = client.app.state.worker_telemetry_store
    base = {
        "engine_id": "system",
        "preset_id": "sori-warm",
        "model_id": "system",
        "model_version": "1",
        "model_digest": "sha256:history-model",
        "device_profile": "cpu",
        "accelerator_name": "cpu",
        "gpu_name": "",
        "processing_ms": 1000,
        "audio_duration_seconds": 4.0,
        "failure_reason": "",
    }
    create_payload = {
        key: base[key]
        for key in (
            "engine_id",
            "preset_id",
            "model_id",
            "model_version",
            "model_digest",
            "device_profile",
            "accelerator_name",
            "gpu_name",
        )
    }
    create_payload.update({
        "confirmation": "현재 성능 기준선 확정",
        "note": "history test",
    })

    for index in range(5):
        store.append({
            **base,
            "id": f"history-base-{index}",
            "worker_job_id": f"history-base-job-{index}",
            "recorded_at": f"2026-08-06T{index:02d}:00:00+00:00",
            "first_audio_ms": 420,
            "realtime_factor": 0.31,
            "final_handoff_error_ms": 18,
            "succeeded": True,
        })
    first = client.post(
        "/api/v1/quality/worker-telemetry/operator-baselines",
        json=create_payload,
    )
    assert first.status_code == 200
    first_baseline = first.json()

    for index in range(5, 10):
        store.append({
            **base,
            "id": f"history-current-{index}",
            "worker_job_id": f"history-current-job-{index}",
            "recorded_at": f"2026-08-06T{index:02d}:00:00+00:00",
            "first_audio_ms": 850,
            "realtime_factor": 0.62,
            "final_handoff_error_ms": 70,
            "succeeded": True,
        })
    second = client.post(
        "/api/v1/quality/worker-telemetry/operator-baselines",
        json={**create_payload, "note": "replacement"},
    )
    assert second.status_code == 200
    second_baseline = second.json()
    assert second_baseline["baseline_id"] != first_baseline["baseline_id"]

    history = client.get(
        "/api/v1/quality/worker-telemetry/operator-baselines/history",
        params={"group_key": first_baseline["group_key"]},
    )
    assert history.status_code == 200
    history_items = history.json()
    assert len(history_items) == 2
    by_id = {item["baseline"]["baseline_id"]: item for item in history_items}
    assert by_id[first_baseline["baseline_id"]]["status"] == "retired"
    assert (
        by_id[first_baseline["baseline_id"]]["replacement_baseline_id"]
        == second_baseline["baseline_id"]
    )
    assert by_id[second_baseline["baseline_id"]]["status"] == "active"

    preview = client.get(
        "/api/v1/quality/worker-telemetry/operator-baselines/"
        f"{first_baseline['baseline_id']}/restore-preview"
    )
    assert preview.status_code == 200
    preview_body = preview.json()
    assert preview_body["target"]["baseline_id"] == first_baseline["baseline_id"]
    assert preview_body["current_active"]["baseline_id"] == second_baseline["baseline_id"]
    assert preview_body["will_replace_active"] is True

    restored = client.post(
        "/api/v1/quality/worker-telemetry/operator-baselines/"
        f"{first_baseline['baseline_id']}/restore",
        json={
            "confirmation": "과거 운영자 기준선 복원",
            "reason": "회귀 전 안정 기준으로 복원",
        },
    )
    assert restored.status_code == 200
    assert restored.json()["baseline_id"] == first_baseline["baseline_id"]

    active = client.get("/api/v1/quality/worker-telemetry/operator-baselines")
    assert active.status_code == 200
    assert [item["baseline_id"] for item in active.json()] == [
        first_baseline["baseline_id"]
    ]

    restored_history = client.get(
        "/api/v1/quality/worker-telemetry/operator-baselines/history",
        params={"group_key": first_baseline["group_key"]},
    ).json()
    restored_by_id = {item["baseline"]["baseline_id"]: item for item in restored_history}
    assert restored_by_id[first_baseline["baseline_id"]]["status"] == "active"
    assert (
        restored_by_id[first_baseline["baseline_id"]]["last_restore_reason"]
        == "회귀 전 안정 기준으로 복원"
    )
    assert restored_by_id[second_baseline["baseline_id"]]["status"] == "retired"
