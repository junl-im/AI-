import asyncio
import importlib.util
import re
import wave
from collections.abc import Callable
from pathlib import Path
from typing import Any
from uuid import UUID, uuid4

from app.engines.base import TtsEngine
from app.schemas.engine import EngineInfo
from app.schemas.tts import TtsSynthesisRequest, TtsSynthesisResponse
from app.services.voice_presets import (
    VoicePresetProfile,
    VoicePresetUnavailableError,
    get_voice_preset,
    list_voice_presets,
)
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
        self._last_selection: dict[str, dict[str, object]] = {}
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
            quality_tier="standard",
            korean_specialization=78,
            long_form=True,
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
            message=(
                f"{get_voice_preset(request.voice_id).display_name} 프리셋과 호환되는 "
                "MeloTTS 화자를 선택했습니다. 단일 화자 모델에서 "
                "반대 성별로 자동 대체하지 않습니다."
            ),
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
    def _identity_has_token(identity: str, token: str) -> bool:
        if token in {"female", "male", "woman", "man", "girl", "boy"}:
            return re.search(rf"(?<![a-z]){re.escape(token)}(?![a-z])", identity) is not None
        return token in identity

    @classmethod
    def _speaker_gender(cls, name: str) -> str:
        identity = name.lower()
        female_tokens = (
            "female", "woman", "girl", "여성", "여자",
            "sunhi", "yuna", "heami", "seoyeon",
        )
        male_tokens = (
            "male", "man", "boy", "남성", "남자",
            "injoon", "hyunsu", "minsu", "bongjin", "yong",
        )
        female = any(cls._identity_has_token(identity, token) for token in female_tokens)
        male = any(cls._identity_has_token(identity, token) for token in male_tokens)
        if female and not male:
            return "female"
        if male and not female:
            return "male"
        return "unknown"

    @classmethod
    def _select_speaker(cls, model: Any, preset: VoicePresetProfile) -> dict[str, object]:
        speaker_ids = dict(model.hps.data.spk2id)
        if not speaker_ids:
            raise RuntimeError("MeloTTS 모델에 선택 가능한 화자가 없습니다.")

        preferred = [
            (name, speaker_id)
            for name, speaker_id in speaker_ids.items()
            if any(token in str(name).lower() for token in preset.preferred_voice_tokens)
            and (
                cls._speaker_gender(str(name)) == preset.gender
                if preset.requires_gender_match
                else cls._speaker_gender(str(name)) == "unknown"
            )
        ]
        if preferred:
            name, speaker_id = preferred[0]
            return {
                "speaker_id": speaker_id,
                "speaker_name": str(name),
                "speaker_gender": cls._speaker_gender(str(name)),
                "selection_basis": "preferred-name",
            }

        if preset.requires_gender_match:
            compatible = [
                (name, speaker_id)
                for name, speaker_id in speaker_ids.items()
                if cls._speaker_gender(str(name)) == preset.gender
            ]
            if len(compatible) <= preset.variant_index:
                label = "남성" if preset.gender == "male" else "여성"
                raise VoicePresetUnavailableError(
                    f"MeloTTS 모델에 {preset.display_name} 프리셋용 "
                    f"{label} 화자가 충분하지 않습니다. "
                    "같은 화자나 반대 성별 화자로 자동 대체하지 않습니다."
                )
            name, speaker_id = compatible[preset.variant_index]
            return {
                "speaker_id": speaker_id,
                "speaker_name": str(name),
                "speaker_gender": preset.gender,
                "selection_basis": f"gender-slot-{preset.variant_index + 1}",
            }

        neutral = [
            (name, speaker_id)
            for name, speaker_id in speaker_ids.items()
            if cls._speaker_gender(str(name)) == "unknown"
        ]
        if len(neutral) <= preset.variant_index:
            raise VoicePresetUnavailableError(
                f"MeloTTS 모델에 {preset.display_name} 프리셋용 중성 화자가 없습니다. "
                "성별이 알려진 다른 화자로 자동 대체하지 않습니다."
            )
        name, speaker_id = neutral[preset.variant_index]
        return {
            "speaker_id": speaker_id,
            "speaker_name": str(name),
            "speaker_gender": "unknown",
            "selection_basis": f"neutral-slot-{preset.variant_index + 1}",
        }

    @classmethod
    def _select_speaker_id(cls, model: Any, preset: VoicePresetProfile) -> Any:
        return cls._select_speaker(model, preset)["speaker_id"]

    def voice_selection_diagnostics(self) -> list[dict[str, object]]:
        results: list[dict[str, object]] = []
        for preset in list_voice_presets():
            base: dict[str, object] = {
                "engine_id": "melo",
                "engine_name": "MeloTTS Korean",
                "voice_id": preset.id,
                "display_name": preset.display_name,
                "expected_gender": preset.gender,
                "status": "idle" if self._ready else "missing",
                "selected_voice_id": None,
                "selected_voice_name": None,
                "selected_gender": None,
                "selection_basis": "model-not-loaded" if self._ready else "package-unavailable",
                "reason": (
                    "첫 생성 후 실제 MeloTTS speaker ID를 확인할 수 있습니다."
                    if self._ready
                    else "MeloTTS 선택 설치가 필요합니다."
                ),
            }
            if self._model is None:
                results.append(base)
                continue
            try:
                selection = self._select_speaker(self._model, preset)
                base.update({
                    "status": "ready",
                    "selected_voice_id": str(selection["speaker_id"]),
                    "selected_voice_name": str(selection["speaker_name"]),
                    "selected_gender": str(selection["speaker_gender"]),
                    "selection_basis": str(selection["selection_basis"]),
                    "reason": "현재 로딩된 MeloTTS 모델에서 선택될 실제 speaker입니다.",
                })
            except (RuntimeError, VoicePresetUnavailableError) as error:
                base.update({
                    "status": "blocked",
                    "selection_basis": "incompatible-model",
                    "reason": str(error),
                })
            results.append(base)
        return results

    def _synthesize_sync(self, model: Any, request: TtsSynthesisRequest, output_path: Path) -> None:
        preset = get_voice_preset(request.voice_id)
        selection = self._select_speaker(model, preset)
        speaker_id = selection["speaker_id"]
        self._last_selection[preset.id] = {
            "selected_voice_id": str(speaker_id),
            "selected_voice_name": str(selection["speaker_name"]),
            "selected_gender": str(selection["speaker_gender"]),
            "selection_basis": str(selection["selection_basis"]),
        }
        effective_speed = max(0.5, min(2.0, request.speed * preset.rate_multiplier))
        model.tts_to_file(request.text, speaker_id, str(output_path), speed=effective_speed)
        if not output_path.is_file() or output_path.stat().st_size <= 44:
            raise RuntimeError("MeloTTS가 유효한 WAV 파일을 만들지 못했습니다.")

    @staticmethod
    def _duration(path: Path) -> float:
        with wave.open(str(path), "rb") as audio:
            return audio.getnframes() / max(1, audio.getframerate())
