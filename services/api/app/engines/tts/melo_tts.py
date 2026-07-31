import asyncio
import importlib.util
import wave
from collections.abc import Callable
from pathlib import Path
from typing import Any
from uuid import UUID, uuid4

from app.engines.base import TtsEngine
from app.schemas.engine import EngineInfo
from app.schemas.tts import TtsSynthesisRequest, TtsSynthesisResponse
from app.storage.audio_store import AudioStore

ModelFactory = Callable[[], Any]


class MeloTtsEngine(TtsEngine):
    def __init__(
        self,
        store: AudioStore,
        device: str = "auto",
        model_factory: ModelFactory | None = None,
        ready_override: bool | None = None,
    ) -> None:
        self.store = store
        self.device = device
        self._model_factory = model_factory
        self._model: Any | None = None
        self._load_lock = asyncio.Lock()
        self._ready = self._detect() if ready_override is None else ready_override

    @staticmethod
    def _detect() -> bool:
        try:
            return importlib.util.find_spec("melo") is not None
        except (ImportError, ValueError):
            return False

    def info(self) -> EngineInfo:
        return EngineInfo(
            id="melo",
            name="MeloTTS Korean",
            kind="tts",
            mode="ai",
            provider="MyShell MeloTTS",
            languages=["ko-KR"],
            output_formats=["wav"],
            supports_emotion=False,
            supports_speed=True,
            supports_pitch=False,
            supports_voice_clone=False,
            ready=self._ready,
            reason=(
                None
                if self._ready
                else "MeloTTS 선택 설치가 필요합니다. docs/ENGINE_PILOT.md를 확인해 주세요."
            ),
        )

    async def synthesize(self, request: TtsSynthesisRequest) -> TtsSynthesisResponse:
        if not self._ready:
            raise RuntimeError("MeloTTS가 설치되지 않았습니다.")
        if request.output_format != "wav":
            raise ValueError("MeloTTS 파일럿은 현재 WAV만 지원합니다.")

        job_id = request.job_id or uuid4()
        output_path = self.store.output_path(UUID(str(job_id)), "wav")
        try:
            model = await self._get_model()
            await asyncio.to_thread(self._synthesize_sync, model, request, output_path)
            duration = self._duration(output_path)
        except BaseException:
            self.store.remove(output_path)
            raise

        return TtsSynthesisResponse(
            job_id=str(job_id),
            status="completed",
            engine_id="melo",
            engine_mode="ai",
            audio_url=f"/api/v1/audio/{output_path.name}",
            estimated_duration_seconds=round(duration, 1),
            message="MeloTTS 한국어 AI 엔진으로 WAV를 생성했습니다.",
        )

    async def _get_model(self) -> Any:
        if self._model is not None:
            return self._model
        async with self._load_lock:
            if self._model is None:
                self._model = await asyncio.to_thread(self._create_model)
        return self._model

    def _create_model(self) -> Any:
        if self._model_factory is not None:
            return self._model_factory()
        from melo.api import TTS

        return TTS(language="KR", device=self.device)

    @staticmethod
    def _synthesize_sync(model: Any, request: TtsSynthesisRequest, output_path: Path) -> None:
        speaker_ids = model.hps.data.spk2id
        speaker_id = speaker_ids["KR"]
        model.tts_to_file(request.text, speaker_id, str(output_path), speed=request.speed)
        if not output_path.is_file() or output_path.stat().st_size <= 44:
            raise RuntimeError("MeloTTS가 유효한 WAV 파일을 만들지 못했습니다.")

    @staticmethod
    def _duration(path: Path) -> float:
        with wave.open(str(path), "rb") as audio:
            return audio.getnframes() / max(1, audio.getframerate())
