import asyncio
from pathlib import Path
from typing import Any


class OfficialCosyVoice3Adapter:
    def __init__(self, model_path: Path | None, device: str) -> None:
        if model_path is None:
            raise ValueError("SORION_WORKER_MODEL_PATH가 필요합니다.")
        if not model_path.exists():
            raise ValueError(f"CosyVoice 모델 경로를 찾을 수 없습니다: {model_path}")
        try:
            import torch
            import torchaudio
            from cosyvoice.cli.cosyvoice import AutoModel
        except ImportError as error:
            raise RuntimeError(
                "CosyVoice 저장소 의존성, torch, torchaudio 설치가 필요합니다."
            ) from error
        self.torch = torch
        self.torchaudio = torchaudio
        self.device = device
        self.model = AutoModel(model_dir=str(model_path))

    async def generate(
        self,
        sample_path: Path,
        text: str,
        output_path: Path,
        on_progress,
        cancel_event: asyncio.Event,
    ) -> None:
        await on_progress(4, "CosyVoice 입력을 준비하고 있습니다.")
        prompt = f"You are a helpful assistant.<|endofprompt|>{text}"
        iterator = await asyncio.to_thread(
            self.model.inference_cross_lingual,
            prompt,
            str(sample_path),
            True,
        )
        chunks: list[Any] = []
        chunk_count = 0
        while True:
            if cancel_event.is_set():
                raise asyncio.CancelledError
            item = await asyncio.to_thread(next, iterator, None)
            if item is None:
                break
            speech = item.get("tts_speech") if isinstance(item, dict) else None
            if speech is None:
                continue
            chunks.append(speech.detach().cpu())
            chunk_count += 1
            progress = min(92, 10 + chunk_count * 12)
            await on_progress(progress, f"스트리밍 음성 조각 {chunk_count}개 생성")
        if not chunks:
            raise RuntimeError("CosyVoice가 음성 조각을 반환하지 않았습니다.")
        waveform = self.torch.cat(chunks, dim=1)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        await asyncio.to_thread(
            self.torchaudio.save,
            str(output_path),
            waveform,
            self.model.sample_rate,
        )
        await on_progress(100, "WAV 구간 저장 완료")


def create_runtime(model_path: Path | None, device: str) -> OfficialCosyVoice3Adapter:
    return OfficialCosyVoice3Adapter(model_path=model_path, device=device)
