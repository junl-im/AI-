import asyncio
import time
from pathlib import Path
from uuid import UUID, uuid4

from app.engines.base import TtsEngine
from app.engines.tts.cloud_common import validate_wave, wave_duration
from app.engines.voiceclone.cosyvoice_worker import CosyVoiceCloneEngine, WorkerClientError
from app.schemas.engine import EngineInfo
from app.schemas.tts import TtsSynthesisRequest, TtsSynthesisResponse
from app.storage.audio_store import AudioStore


class CosyVoiceWorkerTtsEngine(TtsEngine):
    def __init__(
        self,
        store: AudioStore,
        worker: CosyVoiceCloneEngine,
        reference_path: str,
        profile_id: str = "sorion-korean-reference",
        poll_interval_seconds: float = 0.2,
    ) -> None:
        self.store = store
        self.worker = worker
        self.reference_path = (
            Path(reference_path).expanduser().resolve() if reference_path else None
        )
        self.profile_id = profile_id.strip() or "sorion-korean-reference"
        self.poll_interval_seconds = max(0.05, poll_interval_seconds)

    def info(self) -> EngineInfo:
        worker_info = self.worker.info()
        reference_ready = bool(self.reference_path and self.reference_path.is_file())
        ready = worker_info.ready and reference_ready
        if not worker_info.ready:
            reason = worker_info.reason
        elif not reference_ready:
            reason = (
                "SORION_COSYVOICE_TTS_REFERENCE_PATH에 동의받은 한국어 기준 음성을 "
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

    async def synthesize(self, request: TtsSynthesisRequest) -> TtsSynthesisResponse:
        if request.output_format != "wav":
            raise ValueError("CosyVoice Worker 일반 TTS는 현재 WAV만 지원합니다.")
        if not self.info().ready or self.reference_path is None:
            raise RuntimeError(
                self.info().reason
                or "CosyVoice Worker 일반 TTS가 준비되지 않았습니다."
            )

        started = time.perf_counter()
        local_job_id = request.job_id or uuid4()
        worker_job_id: str | None = None
        output_path = self.store.output_path(UUID(str(local_job_id)), "wav")
        try:
            created = await self.worker.create_job(
                self.profile_id,
                request.text,
                self.reference_path,
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
        except BaseException:
            self.store.remove(output_path)
            raise

        processing_ms = round((time.perf_counter() - started) * 1000)
        duration = wave_duration(output_path)
        return TtsSynthesisResponse(
            job_id=str(local_job_id),
            status="completed",
            engine_id="cosyvoice3",
            engine_mode="ai",
            audio_url=f"/api/v1/audio/{output_path.name}",
            estimated_duration_seconds=round(duration, 1),
            message="SoriON CosyVoice 한국어 기준 음색으로 WAV를 생성했습니다.",
            processing_ms=processing_ms,
            file_size_bytes=output_path.stat().st_size,
            realtime_factor=round((processing_ms / 1000) / max(duration, 0.001), 3),
        )
