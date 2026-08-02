from dataclasses import dataclass
from pathlib import Path
from typing import Any


@dataclass(frozen=True)
class SttProbe:
    ready: bool
    reason: str
    engine_id: str = "faster-whisper"


class FasterWhisperAdapter:
    def __init__(self, model_name: str, device: str, compute_type: str) -> None:
        self.model_name = model_name
        self.device = device
        self.compute_type = compute_type
        self._model: Any | None = None

    def probe(self) -> SttProbe:
        try:
            import faster_whisper  # noqa: F401
        except ImportError:
            return SttProbe(
                ready=False,
                reason=(
                    "faster-whisper가 설치되지 않았습니다. STT 선택 의존성을 설치한 뒤 "
                    "다시 확인하세요."
                ),
            )
        return SttProbe(ready=True, reason="Faster Whisper를 불러올 수 있습니다.")

    def _load(self) -> Any:
        if self._model is not None:
            return self._model
        from faster_whisper import WhisperModel

        self._model = WhisperModel(
            self.model_name,
            device=self.device,
            compute_type=self.compute_type,
        )
        return self._model

    def transcribe(self, audio_path: Path) -> tuple[str, float | None]:
        model = self._load()
        segments, info = model.transcribe(
            str(audio_path),
            language="ko",
            vad_filter=True,
            beam_size=5,
        )
        text = " ".join(segment.text.strip() for segment in segments if segment.text.strip())
        duration = getattr(info, "duration", None)
        return text.strip(), float(duration) if duration is not None else None
