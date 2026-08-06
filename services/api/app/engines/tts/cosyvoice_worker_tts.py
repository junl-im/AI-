import asyncio
import time
from collections.abc import Mapping
from datetime import datetime, timezone
from pathlib import Path
from uuid import UUID, uuid4

from app.engines.base import TtsEngine
from app.engines.tts.audio_utils import validate_wave, wave_duration
from app.engines.voiceclone.cosyvoice_worker import CosyVoiceCloneEngine, WorkerClientError
from app.schemas.engine import EngineInfo
from app.schemas.tts import TtsSynthesisRequest, TtsSynthesisResponse
from app.services.device_benchmark_store import DeviceBenchmarkStore
from app.services.voice_preset_evidence import (
    VoicePresetEvidenceInspection,
    inspect_voice_preset_evidence,
    mark_duplicate_checksums,
)
from app.services.voice_preset_validation import inspect_voice_preset
from app.services.voice_presets import (
    PRESET_VOICE_IDS,
    VoicePresetUnavailableError,
    get_voice_preset,
)
from app.storage.audio_store import AudioStore


class CosyVoiceWorkerTtsEngine(TtsEngine):
    def __init__(
        self,
        store: AudioStore,
        worker: CosyVoiceCloneEngine,
        reference_path: str,
        profile_id: str = "sorion-korean-reference",
        poll_interval_seconds: float = 0.2,
        preset_directory: str = "",
        telemetry_store: DeviceBenchmarkStore | None = None,
        review_signing_secret: str = "",
        review_signing_key_id: str = "",
        review_trusted_signing_keys: Mapping[str, str] | None = None,
    ) -> None:
        self.store = store
        self.worker = worker
        self.reference_path = (
            Path(reference_path).expanduser().resolve() if reference_path else None
        )
        self.profile_id = profile_id.strip() or "sorion-korean-reference"
        self.poll_interval_seconds = max(0.05, poll_interval_seconds)
        self.preset_directory = (
            Path(preset_directory).expanduser().resolve() if preset_directory else None
        )
        self.telemetry_store = telemetry_store
        self.review_signing_secret = review_signing_secret
        self.review_signing_key_id = review_signing_key_id
        self.review_trusted_signing_keys = dict(review_trusted_signing_keys or {})

    def info(self) -> EngineInfo:
        worker_info = self.worker.info()
        reference_ready = bool(
            self.reference_path
            and inspect_voice_preset(self.reference_path, "default-reference").usable
        )
        preset_ready = bool(self._available_preset_references())
        ready = worker_info.ready and (reference_ready or preset_ready)
        if not worker_info.ready:
            reason = worker_info.reason
        elif not reference_ready and not preset_ready:
            reason = (
                "SORION_COSYVOICE_TTS_REFERENCE_PATH 또는 "
                "SORION_COSYVOICE_PRESET_DIRECTORY에 동의받은 한국어 기준 음성을 "
                "설정하면 일반 TTS로 자동 등록됩니다."
            )
        else:
            reason = None
        return EngineInfo(
            id="cosyvoice3",
            name="SoriON CosyVoice Korean",
            kind="tts",
            mode="ai",
            provider="FunAudioLLM CosyVoice 3",
            languages=["ko-KR"],
            output_formats=["wav"],
            supports_emotion=False,
            supports_speed=False,
            supports_pitch=False,
            supports_voice_clone=True,
            ready=ready,
            reason=reason,
            quality_tier="reference",
            korean_specialization=96,
            long_form=True,
            streaming=False,
        )

    def _preset_evidence(self) -> dict[str, VoicePresetEvidenceInspection]:
        if self.preset_directory is None or not self.preset_directory.is_dir():
            return {}
        evidence = mark_duplicate_checksums([
            inspect_voice_preset_evidence(
                self.preset_directory,
                get_voice_preset(voice_id),
                inspect_voice_preset(
                    self.preset_directory / f"{voice_id}.wav",
                    voice_id,
                ),
                self.review_signing_secret,
                self.review_signing_key_id,
                self.review_trusted_signing_keys,
            )
            for voice_id in PRESET_VOICE_IDS
        ])
        return {item.voice_id: item for item in evidence}

    def _available_preset_references(self) -> list[Path]:
        if self.preset_directory is None or not self.preset_directory.is_dir():
            return []
        evidence = self._preset_evidence()
        return [
            path
            for voice_id in PRESET_VOICE_IDS
            if (path := self.preset_directory / f"{voice_id}.wav").is_file()
            and evidence.get(voice_id) is not None
            and evidence[voice_id].ready
        ]

    def _reference_for(self, voice_id: str) -> tuple[Path, str, bool]:
        if voice_id in PRESET_VOICE_IDS:
            if self.preset_directory is None:
                raise VoicePresetUnavailableError(
                    f"{voice_id} 전용 CosyVoice 기준 음성 폴더가 연결되지 않았습니다. "
                    "다른 사람의 기본 음성으로 자동 대체하지 않습니다."
                )
            preset_path = self.preset_directory / f"{voice_id}.wav"
            inspection = inspect_voice_preset(preset_path, voice_id)
            evidence = self._preset_evidence().get(voice_id)
            if evidence is None:
                raise VoicePresetUnavailableError(
                    f"{voice_id} 전용 CosyVoice 증거 manifest를 검사하지 못했습니다."
                )
            if not inspection.usable:
                detail = ", ".join(inspection.issues) or inspection.status
                raise VoicePresetUnavailableError(
                    f"{voice_id} 전용 CosyVoice WAV를 사용할 수 없습니다: {detail}. "
                    "다른 프리셋 또는 기본 음성으로 자동 대체하지 않습니다."
                )
            if not evidence.ready:
                detail = ", ".join(evidence.issues) or evidence.status
                raise VoicePresetUnavailableError(
                    f"{voice_id} 전용 CosyVoice 증거 manifest가 인증되지 않았습니다: "
                    f"{detail}. 동의·권리·사람 검수·SHA-256을 완료하기 전에는 "
                    "전용 인물 음색으로 사용하지 않습니다."
                )
            return preset_path, f"{self.profile_id}-{voice_id}", True

        if (
            self.reference_path is not None
            and inspect_voice_preset(self.reference_path, "default-reference").usable
        ):
            return self.reference_path, self.profile_id, False
        raise RuntimeError(
            f"{voice_id}에 사용할 기본 CosyVoice 기준 음성이 없습니다."
        )

    async def _record_telemetry(
        self,
        *,
        request: TtsSynthesisRequest,
        worker_job_id: str,
        worker_status: dict[str, object],
        processing_ms: int,
        duration_seconds: float | None,
        succeeded: bool,
        failure_reason: str = "",
    ) -> None:
        if self.telemetry_store is None:
            return
        try:
            diagnostics = await self.worker.diagnostics()
        except Exception:
            diagnostics = self.worker.probe_snapshot().get("diagnostics") or {}
        if not isinstance(diagnostics, dict):
            diagnostics = {}
        worker_duration = worker_status.get("duration_seconds")
        worker_duration_value = (
            float(worker_duration)
            if isinstance(worker_duration, (int, float)) and worker_duration > 0
            else None
        )
        handoff_error_ms = None
        if duration_seconds is not None and worker_duration_value is not None:
            handoff_error_ms = round(abs(duration_seconds - worker_duration_value) * 1000)
        first_audio = worker_status.get("first_audio_ms")
        first_audio_ms = int(first_audio) if isinstance(first_audio, int) else None
        rtf = None
        if duration_seconds and duration_seconds > 0:
            rtf = round((processing_ms / 1000) / duration_seconds, 4)
        self.telemetry_store.append({
            "id": str(uuid4()),
            "recorded_at": datetime.now(timezone.utc).isoformat(),
            "engine_id": "cosyvoice3",
            "worker_job_id": worker_job_id,
            "preset_id": request.voice_id,
            "model_id": str(diagnostics.get("model_id") or "unknown"),
            "model_version": str(diagnostics.get("model_version") or "unknown"),
            "model_digest": str(diagnostics.get("model_digest") or ""),
            "device_profile": str(diagnostics.get("hardware_profile") or "unknown"),
            "accelerator_name": str(diagnostics.get("device") or "unknown"),
            "gpu_name": str(diagnostics.get("gpu_name") or ""),
            "first_audio_ms": first_audio_ms,
            "processing_ms": processing_ms,
            "audio_duration_seconds": duration_seconds,
            "realtime_factor": rtf,
            "final_handoff_error_ms": handoff_error_ms,
            "succeeded": succeeded,
            "failure_reason": failure_reason[:1000],
        })

    async def synthesize(self, request: TtsSynthesisRequest) -> TtsSynthesisResponse:
        if request.output_format != "wav":
            raise ValueError("CosyVoice Worker 일반 TTS는 현재 WAV만 지원합니다.")
        if not self.info().ready:
            raise RuntimeError(
                self.info().reason
                or "CosyVoice Worker 일반 TTS가 준비되지 않았습니다."
            )
        reference_path, profile_id, preset_applied = self._reference_for(request.voice_id)

        started = time.perf_counter()
        local_job_id = request.job_id or uuid4()
        worker_job_id: str | None = None
        status: dict[str, object] = {}
        output_path = self.store.output_path(UUID(str(local_job_id)), "wav")
        try:
            created = await self.worker.create_job(
                profile_id,
                request.text,
                reference_path,
            )
            worker_job_id = str(created.get("id") or "")
            if not worker_job_id:
                raise WorkerClientError("Worker가 job id를 반환하지 않았습니다.")
            status = created
            deadline = time.monotonic() + self.worker.job_timeout_seconds
            while str(status.get("status")) in {"queued", "running"}:
                if time.monotonic() >= deadline:
                    await self.worker.cancel_job(worker_job_id)
                    raise WorkerClientError(
                        "CosyVoice Worker 일반 TTS 생성 시간이 초과되었습니다.",
                        504,
                    )
                await asyncio.sleep(self.poll_interval_seconds)
                status = await self.worker.get_job(worker_job_id)
            final_status = str(status.get("status"))
            if final_status != "completed":
                message = str(status.get("error") or status.get("message") or final_status)
                raise WorkerClientError(f"CosyVoice Worker 생성 실패: {message}")
            output_path.write_bytes(await self.worker.download_audio(worker_job_id))
            validate_wave(output_path)
        except BaseException as error:
            self.store.remove(output_path)
            processing_ms = round((time.perf_counter() - started) * 1000)
            await self._record_telemetry(
                request=request,
                worker_job_id=worker_job_id or "",
                worker_status=status if isinstance(status, dict) else {},
                processing_ms=processing_ms,
                duration_seconds=None,
                succeeded=False,
                failure_reason=str(error),
            )
            raise

        processing_ms = round((time.perf_counter() - started) * 1000)
        duration = wave_duration(output_path)
        await self._record_telemetry(
            request=request,
            worker_job_id=worker_job_id or "",
            worker_status=status if isinstance(status, dict) else {},
            processing_ms=processing_ms,
            duration_seconds=duration,
            succeeded=True,
        )
        return TtsSynthesisResponse(
            job_id=str(local_job_id),
            status="completed",
            engine_id="cosyvoice3",
            engine_mode="ai",
            audio_url=f"/api/v1/audio/{output_path.name}",
            estimated_duration_seconds=round(duration, 1),
            message=(
                f"{request.voice_id} 전용 WAV와 동의·권리·사람 검수·SHA-256 "
                "manifest를 확인해 생성했습니다. 다른 프리셋 음성 폴백은 "
                "사용하지 않았습니다."
                if preset_applied
                else (
                    "명시적으로 지정한 SoriON CosyVoice 기본 한국어 "
                    "기준 음색으로 WAV를 생성했습니다."
                )
            ),
            processing_ms=processing_ms,
            file_size_bytes=output_path.stat().st_size,
            realtime_factor=round((processing_ms / 1000) / max(duration, 0.001), 3),
        )
