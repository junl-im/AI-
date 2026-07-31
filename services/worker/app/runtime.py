import asyncio
import importlib
import inspect
from dataclasses import dataclass
from pathlib import Path
from typing import Awaitable, Callable, Protocol

from app.config import WorkerSettings

ProgressCallback = Callable[[int, str], Awaitable[None]]


class RuntimeUnavailableError(RuntimeError):
    pass


class RuntimeAdapter(Protocol):
    async def generate(
        self,
        sample_path: Path,
        text: str,
        output_path: Path,
        on_progress: ProgressCallback,
        cancel_event: asyncio.Event,
    ) -> None: ...


@dataclass(frozen=True)
class RuntimeDiagnostics:
    ready: bool
    backend: str
    reason: str
    device: str
    model_path: str | None
    model_exists: bool
    adapter_module: str | None
    adapter_loaded: bool
    torch_available: bool
    cuda_available: bool
    cuda_device_count: int
    gpu_name: str | None
    vram_total_mb: int | None

    def as_dict(self) -> dict[str, object]:
        return {
            "ready": self.ready,
            "backend": self.backend,
            "reason": self.reason,
            "device": self.device,
            "model_path": self.model_path,
            "model_exists": self.model_exists,
            "adapter_module": self.adapter_module,
            "adapter_loaded": self.adapter_loaded,
            "torch_available": self.torch_available,
            "cuda_available": self.cuda_available,
            "cuda_device_count": self.cuda_device_count,
            "gpu_name": self.gpu_name,
            "vram_total_mb": self.vram_total_mb,
        }


class CosyVoiceRuntime:
    def __init__(self, settings: WorkerSettings) -> None:
        self.settings = settings
        self._adapter: RuntimeAdapter | None = None
        self._adapter_error: str | None = None
        self._load_adapter()

    def _load_adapter(self) -> None:
        module_name = self.settings.adapter_module.strip()
        if not module_name:
            self._adapter_error = (
                "SORION_WORKER_ADAPTER_MODULE이 설정되지 않아 실제 모델을 실행하지 않습니다."
            )
            return
        try:
            module = importlib.import_module(module_name)
            factory = getattr(module, "create_runtime")
            adapter = factory(
                model_path=self.settings.model_path,
                device=self.settings.device,
            )
            self._adapter = adapter
        except (ImportError, AttributeError, TypeError, ValueError, RuntimeError) as error:
            self._adapter_error = f"CosyVoice adapter를 불러오지 못했습니다: {error}"

    def diagnostics(self) -> RuntimeDiagnostics:
        torch_available = False
        cuda_available = False
        cuda_device_count = 0
        gpu_name = None
        vram_total_mb = None
        try:
            import torch

            torch_available = True
            cuda_available = bool(torch.cuda.is_available())
            cuda_device_count = torch.cuda.device_count() if cuda_available else 0
            if cuda_available and cuda_device_count > 0:
                gpu_name = torch.cuda.get_device_name(0)
                properties = torch.cuda.get_device_properties(0)
                vram_total_mb = round(properties.total_memory / 1024 / 1024)
        except ImportError:
            pass

        model_path = self.settings.model_path
        model_exists = bool(model_path and model_path.exists())
        adapter_loaded = self._adapter is not None
        ready = adapter_loaded and (model_path is None or model_exists)
        reason = "CosyVoice adapter와 모델이 준비되었습니다."
        if not adapter_loaded:
            reason = self._adapter_error or "CosyVoice adapter가 준비되지 않았습니다."
        elif model_path is not None and not model_exists:
            reason = f"모델 경로를 찾을 수 없습니다: {model_path}"

        return RuntimeDiagnostics(
            ready=ready,
            backend="cosyvoice3" if adapter_loaded else "unavailable",
            reason=reason,
            device=self.settings.device,
            model_path=str(model_path) if model_path else None,
            model_exists=model_exists,
            adapter_module=self.settings.adapter_module or None,
            adapter_loaded=adapter_loaded,
            torch_available=torch_available,
            cuda_available=cuda_available,
            cuda_device_count=cuda_device_count,
            gpu_name=gpu_name,
            vram_total_mb=vram_total_mb,
        )

    async def generate(
        self,
        sample_path: Path,
        text: str,
        output_path: Path,
        on_progress: ProgressCallback,
        cancel_event: asyncio.Event,
    ) -> None:
        diagnostics = self.diagnostics()
        if not diagnostics.ready or self._adapter is None:
            raise RuntimeUnavailableError(diagnostics.reason)
        result = self._adapter.generate(
            sample_path,
            text,
            output_path,
            on_progress,
            cancel_event,
        )
        if inspect.isawaitable(result):
            await result
        if not output_path.exists() or output_path.stat().st_size == 0:
            raise RuntimeError("CosyVoice adapter가 유효한 WAV 파일을 만들지 않았습니다.")
