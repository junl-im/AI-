import asyncio
import importlib
import inspect
import shutil
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
    missing_model_files: list[str]
    adapter_module: str | None
    adapter_loaded: bool
    torch_available: bool
    cuda_available: bool
    cuda_device_count: int
    gpu_name: str | None
    vram_total_mb: int | None
    disk_free_mb: int | None
    security_enabled: bool
    security_ready: bool

    def as_dict(self) -> dict[str, object]:
        return self.__dict__.copy()


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
            self._adapter = factory(
                model_path=self.settings.model_path,
                device=self.settings.device,
            )
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
        missing_files = self._missing_model_files(model_path)
        disk_free_mb = self._disk_free_mb()
        adapter_loaded = self._adapter is not None
        ready = adapter_loaded and model_exists and not missing_files
        reason = "CosyVoice adapter와 모델이 준비되었습니다."
        if model_path is None:
            ready = False
            reason = "SORION_WORKER_MODEL_PATH가 필요합니다."
        elif not model_exists:
            ready = False
            reason = f"모델 경로를 찾을 수 없습니다: {model_path}"
        elif missing_files:
            ready = False
            reason = "필수 모델 파일이 없습니다: " + ", ".join(missing_files)
        elif not adapter_loaded:
            ready = False
            reason = self._adapter_error or "CosyVoice adapter가 준비되지 않았습니다."
        elif not self.settings.auth_ready:
            ready = False
            reason = "production Worker에는 서비스 토큰과 서명 비밀키가 모두 필요합니다."
        elif self._device_blocked(cuda_available, vram_total_mb):
            ready = False
            reason = self._device_reason(cuda_available, vram_total_mb)

        return RuntimeDiagnostics(
            ready=ready,
            backend="cosyvoice3" if adapter_loaded else "unavailable",
            reason=reason,
            device=self.settings.device,
            model_path=str(model_path) if model_path else None,
            model_exists=model_exists,
            missing_model_files=missing_files,
            adapter_module=self.settings.adapter_module or None,
            adapter_loaded=adapter_loaded,
            torch_available=torch_available,
            cuda_available=cuda_available,
            cuda_device_count=cuda_device_count,
            gpu_name=gpu_name,
            vram_total_mb=vram_total_mb,
            disk_free_mb=disk_free_mb,
            security_enabled=self.settings.auth_enabled,
            security_ready=self.settings.auth_ready,
        )

    def _missing_model_files(self, model_path: Path | None) -> list[str]:
        if model_path is None or not model_path.exists():
            return self.settings.required_model_file_list
        return [
            name
            for name in self.settings.required_model_file_list
            if not (model_path / name).exists()
        ]

    def _disk_free_mb(self) -> int | None:
        try:
            target = self.settings.output_path.resolve()
            target.mkdir(parents=True, exist_ok=True)
            return round(shutil.disk_usage(target).free / 1024 / 1024)
        except OSError:
            return None

    def _device_blocked(self, cuda_available: bool, vram_total_mb: int | None) -> bool:
        device = self.settings.device.lower()
        if device == "cpu":
            return not self.settings.allow_cpu
        if device.startswith("cuda") or device == "auto":
            if not cuda_available:
                return not self.settings.allow_cpu
            if vram_total_mb is not None and vram_total_mb < self.settings.min_vram_mb:
                return True
        return False

    def _device_reason(self, cuda_available: bool, vram_total_mb: int | None) -> str:
        if not cuda_available and not self.settings.allow_cpu:
            return "CUDA GPU를 찾지 못했습니다. CPU 저속 모드를 허용하려면 allow_cpu를 켜세요."
        if vram_total_mb is not None and vram_total_mb < self.settings.min_vram_mb:
            return (
                f"VRAM {vram_total_mb}MB는 최소 {self.settings.min_vram_mb}MB보다 작습니다."
            )
        return "선택한 실행 장치를 사용할 수 없습니다."

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
