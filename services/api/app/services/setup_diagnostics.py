import hashlib
import os
import shutil
import sys
from collections.abc import Mapping
from pathlib import Path

from app.core.config import Settings
from app.engines.base import TtsEngine
from app.schemas.setup import (
    SetupStatusResponse,
    SetupStep,
    VoicePresetDiagnostic,
    VoiceSelectionDiagnostic,
)
from app.services.voice_preset_evidence import (
    inspect_voice_preset_evidence,
    mark_duplicate_checksums,
)
from app.services.voice_preset_validation import inspect_voice_preset
from app.services.voice_presets import PRESET_VOICE_IDS, list_voice_presets


def _audio_directory_check(path: Path) -> SetupStep:
    try:
        path.mkdir(parents=True, exist_ok=True)
        probe = path / ".write-probe"
        probe.write_text("ok", encoding="utf-8")
        probe.unlink(missing_ok=True)
        return SetupStep(
            id="audio-directory",
            label="임시 음원 폴더",
            status="ready",
            required=True,
            detail="WAV 파일을 저장할 수 있습니다.",
        )
    except OSError as error:
        return SetupStep(
            id="audio-directory",
            label="임시 음원 폴더",
            status="missing",
            required=True,
            detail=f"폴더에 쓸 수 없습니다: {error}",
            action="SORION_AUDIO_DIRECTORY를 쓰기 가능한 경로로 변경하세요.",
        )


def _voice_preset_check(
    path: Path | None,
    signing_secret: str = "",
    signing_key_id: str = "",
    trusted_signing_keys: Mapping[str, str] | None = None,
) -> tuple[SetupStep, int, list[VoicePresetDiagnostic]]:
    profiles = list(list_voice_presets())
    if path is None:
        diagnostics = [
            VoicePresetDiagnostic(
                voice_id=profile.id,
                display_name=profile.display_name,
                declared_gender=profile.gender,
                filename=f"{profile.id}.wav",
                manifest_filename=f"{profile.id}.manifest.json",
                status="missing",
                usable=False,
                audio_usable=False,
                manifest_status="missing",
                manifest_valid=False,
                neural_preview_ready=False,
                preview_cache_key=None,
                issues=["프리셋 폴더가 연결되지 않았습니다."],
            )
            for profile in profiles
        ]
        return (
            SetupStep(
                id="voice-presets",
                label="CosyVoice 프리셋 음색·증거",
                status="warning",
                required=False,
                detail=(
                    f"프리셋 폴더가 연결되지 않았습니다. "
                    f"인증 완료 0/{len(PRESET_VOICE_IDS)}"
                ),
                action=(
                    "START_ENGINE.cmd로 실행하거나 "
                    "SORION_COSYVOICE_PRESET_DIRECTORY를 설정하세요."
                ),
            ),
            0,
            diagnostics,
        )

    audio_inspections = [
        inspect_voice_preset(path / f"{profile.id}.wav", profile.id)
        for profile in profiles
    ]
    evidence_inspections = mark_duplicate_checksums([
        inspect_voice_preset_evidence(
            path,
            profile,
            audio,
            signing_secret,
            signing_key_id,
            trusted_signing_keys,
        )
        for profile, audio in zip(profiles, audio_inspections, strict=True)
    ])

    diagnostics: list[VoicePresetDiagnostic] = []
    for profile, audio, evidence in zip(
        profiles,
        audio_inspections,
        evidence_inspections,
        strict=True,
    ):
        if audio.status == "missing":
            status = "missing"
        elif audio.status == "blocked" or evidence.status == "blocked":
            status = "blocked"
        elif audio.usable and evidence.ready:
            status = "ready"
        else:
            status = "warning"
        usable = bool(audio.usable and evidence.ready)
        model_fingerprint_ready = bool(
            evidence.model_fingerprint
            and len(evidence.model_fingerprint) == 64
            and all(char in "0123456789abcdef" for char in evidence.model_fingerprint)
        )
        reference_fingerprint_ready = bool(
            evidence.actual_sha256
            and evidence.reference_fingerprint == evidence.actual_sha256
        )
        neural_preview_ready = bool(
            usable
            and (evidence.schema_version or 0) >= 4
            and evidence.neural_preview_engine_id == "cosyvoice3"
            and model_fingerprint_ready
            and reference_fingerprint_ready
        )
        preview_cache_key = None
        if neural_preview_ready:
            preview_cache_key = hashlib.sha256(
                ":".join([
                    profile.id,
                    evidence.actual_sha256 or "",
                    evidence.model_fingerprint or "",
                    evidence.approval_id or "",
                    evidence.signed_payload_sha256 or "",
                ]).encode("utf-8")
            ).hexdigest()
        issues = [*audio.issues, *evidence.issues]
        if audio.usable and not evidence.ready and not issues:
            issues.append("WAV는 사용 가능하지만 증거 manifest 인증이 완료되지 않았습니다.")
        diagnostics.append(VoicePresetDiagnostic(
            voice_id=profile.id,
            display_name=profile.display_name,
            declared_gender=profile.gender,
            filename=audio.filename,
            manifest_filename=evidence.manifest_filename,
            schema_version=evidence.schema_version,
            status=status,
            usable=usable,
            audio_usable=audio.usable,
            manifest_status=evidence.status,
            manifest_valid=evidence.valid,
            consent_status=evidence.consent_status,
            human_review_status=evidence.human_review_status,
            source_type=evidence.source_type,
            allowed_uses=list(evidence.allowed_uses),
            declared_sha256=evidence.declared_sha256,
            actual_sha256=evidence.actual_sha256,
            checksum_matches=evidence.checksum_matches,
            review_audio_sha256=evidence.review_audio_sha256,
            review_checksum_matches=evidence.review_checksum_matches,
            approval_id=evidence.approval_id,
            signature_mode=evidence.signature_mode,
            signing_key_id=evidence.signing_key_id,
            signature_status=evidence.signature_status,
            signed_payload_sha256=evidence.signed_payload_sha256,
            neural_preview_engine_id=evidence.neural_preview_engine_id,
            model_id=evidence.model_id,
            model_fingerprint=evidence.model_fingerprint,
            reference_fingerprint=evidence.reference_fingerprint,
            neural_preview_ready=neural_preview_ready,
            preview_cache_key=preview_cache_key,
            consent_expires_at=(
                evidence.consent_expires_at.isoformat()
                if evidence.consent_expires_at
                else None
            ),
            rights_expires_at=(
                evidence.rights_expires_at.isoformat()
                if evidence.rights_expires_at
                else None
            ),
            consent_days_remaining=evidence.consent_days_remaining,
            rights_days_remaining=evidence.rights_days_remaining,
            duplicate_voice_ids=list(evidence.duplicate_voice_ids),
            duration_seconds=audio.duration_seconds,
            sample_rate=audio.sample_rate,
            channel_count=audio.channel_count,
            sample_width_bits=audio.sample_width_bits,
            silence_ratio=audio.silence_ratio,
            clipping_ratio=audio.clipping_ratio,
            issues=issues,
        ))

    certified_count = sum(1 for item in diagnostics if item.usable)
    audio_ready_count = sum(1 for item in diagnostics if item.audio_usable)
    manifest_ready_count = sum(
        1 for item in diagnostics if item.manifest_status == "ready"
    )
    duplicate_ids = sorted({
        item.voice_id
        for item in diagnostics
        if item.duplicate_voice_ids
    })
    missing = [item.voice_id for item in diagnostics if item.status == "missing"]
    blocked = [item.voice_id for item in diagnostics if item.status == "blocked"]
    pending = [item.voice_id for item in diagnostics if item.status == "warning"]

    if certified_count == len(PRESET_VOICE_IDS):
        detail = (
            f"인증 완료 {certified_count}/{len(PRESET_VOICE_IDS)} · "
            "WAV·동의·권리·사람 검수·SHA-256·중복 검사 통과"
        )
        status = "ready"
        action = None
    else:
        parts = [
            f"인증 완료 {certified_count}/{len(PRESET_VOICE_IDS)}",
            f"WAV 통과 {audio_ready_count}/{len(PRESET_VOICE_IDS)}",
            f"manifest 통과 {manifest_ready_count}/{len(PRESET_VOICE_IDS)}",
        ]
        if missing:
            parts.append(f"누락: {', '.join(missing)}")
        if blocked:
            parts.append(f"차단: {', '.join(blocked)}")
        if pending:
            parts.append(f"검수 대기: {', '.join(pending)}")
        if duplicate_ids:
            parts.append(f"중복 WAV: {', '.join(duplicate_ids)}")
        detail = " · ".join(parts)
        status = "warning"
        action = (
            "각 WAV와 동일 ID manifest를 준비하고 동의·권리·사람 검수·"
            "SHA-256을 완료하세요. 같은 WAV를 여러 인물에 등록하지 마세요."
        )
    return (
        SetupStep(
            id="voice-presets",
            label="CosyVoice 프리셋 음색·증거",
            status=status,
            required=False,
            detail=detail,
            action=action,
        ),
        certified_count,
        diagnostics,
    )


def _voice_selection_diagnostics(engines: list[TtsEngine]) -> list[VoiceSelectionDiagnostic]:
    diagnostics: list[VoiceSelectionDiagnostic] = []
    for engine in engines:
        provider = getattr(engine, "voice_selection_diagnostics", None)
        if not callable(provider):
            continue
        try:
            raw_items = provider()
        except Exception as error:  # 진단 실패가 엔진 실행 자체를 막지 않게 격리합니다.
            info = engine.info()
            diagnostics.append(VoiceSelectionDiagnostic(
                engine_id=info.id,
                engine_name=info.name,
                voice_id="all",
                display_name="전체 프리셋",
                expected_gender="unknown",
                status="blocked",
                selection_basis="diagnostic-error",
                reason=f"화자 선택 진단 실패: {error}",
            ))
            continue
        diagnostics.extend(VoiceSelectionDiagnostic.model_validate(item) for item in raw_items)
    return diagnostics


def setup_status(version: str, settings: Settings, engines: list[TtsEngine]) -> SetupStatusResponse:
    real_engines = [engine.info() for engine in engines if engine.info().mode != "mock"]
    ready_real = [engine for engine in real_engines if engine.ready]
    python_ready = sys.version_info >= (3, 10) and sys.version_info < (3, 13)
    ffmpeg = shutil.which("ffmpeg")
    preset_step, preset_ready_count, preset_diagnostics = _voice_preset_check(
        settings.cosyvoice_preset_path,
        settings.voice_review_signing_secret,
        settings.voice_review_signing_key_id,
        settings.voice_review_trusted_key_map,
    )
    preset_audio_ready_count = sum(
        1 for item in preset_diagnostics if item.audio_usable
    )
    preset_manifest_ready_count = sum(
        1 for item in preset_diagnostics if item.manifest_status == "ready"
    )
    duplicate_groups = {
        tuple(sorted((item.voice_id, *item.duplicate_voice_ids)))
        for item in preset_diagnostics
        if item.duplicate_voice_ids
    }
    steps = [
        SetupStep(
            id="python",
            label="Python 3.10 이상 · 지원 상한 3.12",
            status="ready" if python_ready else "missing",
            required=True,
            detail=sys.version.split()[0],
            action=None if python_ready else "Python 3.10~3.12를 설치하세요.",
        ),
        _audio_directory_check(settings.audio_path),
        SetupStep(
            id="real-engine",
            label="실제 한국어 음성 엔진",
            status="ready" if ready_real else "missing",
            required=True,
            detail=(
                ", ".join(engine.name for engine in ready_real)
                if ready_real
                else "MeloTTS 또는 한국어 시스템 음성을 찾지 못했습니다."
            ),
            action=(
                None
                if ready_real
                else "docs/ENGINE_PILOT.md의 운영체제별 설치 절차를 진행하세요."
            ),
        ),
        preset_step,
        SetupStep(
            id="ffmpeg",
            label="FFmpeg 변환 도구",
            status="ready" if ffmpeg else "warning",
            required=False,
            detail=ffmpeg or "설치되지 않았습니다. WAV 생성에는 필요하지 않습니다.",
            action=None if ffmpeg else "MP3·FLAC 변환이 필요할 때 FFmpeg를 설치하세요.",
        ),
        SetupStep(
            id="cors",
            label="웹 연결 허용 주소",
            status="ready" if settings.cors_origin_list else "warning",
            required=True,
            detail=", ".join(settings.cors_origin_list) or "허용 주소가 비어 있습니다.",
            action="배포 주소를 SORION_CORS_ORIGINS에 추가하세요.",
        ),
        SetupStep(
            id="environment",
            label="실행 환경",
            status=(
                "ready"
                if settings.environment in {"development", "production"}
                else "warning"
            ),
            required=False,
            detail=f"{settings.environment} · PID {os.getpid()}",
        ),
    ]
    required_ready = all(step.status == "ready" for step in steps if step.required)
    return SetupStatusResponse(
        version=version,
        ready=required_ready,
        real_engine_count=len(ready_real),
        voice_preset_ready_count=preset_ready_count,
        voice_preset_audio_ready_count=preset_audio_ready_count,
        voice_preset_manifest_ready_count=preset_manifest_ready_count,
        voice_preset_expected_count=len(PRESET_VOICE_IDS),
        voice_preset_duplicate_group_count=len(duplicate_groups),
        voice_preset_diagnostics=preset_diagnostics,
        voice_selection_diagnostics=_voice_selection_diagnostics(engines),
        steps=steps,
    )


def inspect_voice_preset_diagnostics(settings: Settings) -> list[VoicePresetDiagnostic]:
    """Return current preset diagnostics without exposing raw reference assets."""
    _, _, diagnostics = _voice_preset_check(
        settings.cosyvoice_preset_path,
        settings.voice_review_signing_secret,
        settings.voice_review_signing_key_id,
        settings.voice_review_trusted_key_map,
    )
    return diagnostics
