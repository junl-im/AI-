import asyncio
import importlib
import inspect
import shutil
import threading
from collections.abc import Awaitable, Callable
from dataclasses import dataclass
from pathlib import Path
from typing import Protocol

from app.config import WorkerSettings
from app.model_manifest import HashCache, ModelVerification, verify_model_manifest

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
    mps_available: bool = False
    hardware_profile: str = "unavailable"
    hardware_supported: bool = False
    hardware_reason: str = "실행 장치 진단이 없습니다."
    model_manifest_required: bool = True
    model_manifest_path: str | None = None
    model_manifest_exists: bool = False
    model_manifest_valid: bool = False
    model_id: str | None = None
    model_version: str | None = None
    model_license_name: str | None = None
    model_license_url: str | None = None
    model_license_requires_acceptance: bool = False
    model_license_accepted: bool = False
    model_checksum_verified: bool = False
    model_checksum_failures: list[str] | None = None
    model_declared_file_count: int = 0
    model_verified_file_count: int = 0
    model_size_mb: int | None = None
    model_install_state: str = "unknown"
    min_disk_free_mb: int = 0

    def as_dict(self) -> dict[str, object]:
        payload = self.__dict__.copy()
        if payload["model_checksum_failures"] is None:
            payload["model_checksum_failures"] = []
        return payload


@dataclass(frozen=True)
class TorchSnapshot:
    available: bool
    cuda_available: bool
    cuda_device_count: int
    gpu_name: str | None
    vram_total_mb: int | None
    mps_available: bool


class CosyVoiceRuntime:
    def __init__(self, settings: WorkerSettings) -> None:
        self.settings = settings
        self._adapter: RuntimeAdapter | None = None
        self._adapter_error: str | None = None
        self._adapter_load_attempted = False
        self._adapter_lock = threading.Lock()
        self._model_hash_cache: HashCache = {}

    def _load_adapter(self) -> None:
        with self._adapter_lock:
            if self._adapter is not None or self._adapter_load_attempted:
                return
            self._adapter_load_attempted = True
            module_name = self.settings.adapter_module.strip()
            if not module_name:
                self._adapter_error = (
                    "SORION_WORKER_ADAPTER_MODULE이 설정되지 않아 실제 모델을 실행하지 않습니다."
                )
                return
            try:
                module = importlib.import_module(module_name)
                factory = module.create_runtime
                self._adapter = factory(
                    model_path=self.settings.model_path,
                    device=self.settings.device,
                )
            except (ImportError, AttributeError, TypeError, ValueError, RuntimeError) as error:
                self._adapter_error = f"CosyVoice adapter를 불러오지 못했습니다: {error}"

    def diagnostics(self) -> RuntimeDiagnostics:
        torch = self._torch_snapshot()
        model_path = self.settings.model_path
        model_exists = bool(model_path and model_path.is_dir())
        missing_files = self._missing_model_files(model_path)
        disk_free_mb = self._disk_free_mb()
        verification = verify_model_manifest(
            model_path,
            self.settings.model_manifest_path,
            self.settings.model_license_accepted,
            self._model_hash_cache,
        )
        hardware_profile, hardware_supported, hardware_reason = self._hardware_status(torch)
        issue = self._preflight_issue(
            model_path,
            model_exists,
            missing_files,
            verification,
            hardware_supported,
            hardware_reason,
            disk_free_mb,
        )
        if issue is None:
            self._load_adapter()
        adapter_loaded = self._adapter is not None
        if issue is None and not adapter_loaded:
            issue = self._adapter_error or "CosyVoice adapter가 준비되지 않았습니다."
        ready = issue is None and adapter_loaded
        reason = issue or self._ready_reason(verification, hardware_profile)
        install_state = self._install_state(
            model_path,
            model_exists,
            missing_files,
            verification,
            hardware_supported,
            disk_free_mb,
            adapter_loaded,
        )
        model_size_mb = None
        if verification.declared_total_bytes is not None:
            model_size_mb = round(verification.declared_total_bytes / 1024 / 1024)
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
            torch_available=torch.available,
            cuda_available=torch.cuda_available,
            cuda_device_count=torch.cuda_device_count,
            gpu_name=torch.gpu_name,
            vram_total_mb=torch.vram_total_mb,
            disk_free_mb=disk_free_mb,
            security_enabled=self.settings.auth_enabled,
            security_ready=self.settings.auth_ready,
            mps_available=torch.mps_available,
            hardware_profile=hardware_profile,
            hardware_supported=hardware_supported,
            hardware_reason=hardware_reason,
            model_manifest_required=self.settings.require_model_manifest,
            model_manifest_path=verification.manifest_path,
            model_manifest_exists=verification.manifest_exists,
            model_manifest_valid=verification.manifest_valid,
            model_id=verification.model_id,
            model_version=verification.model_version,
            model_license_name=verification.license_name,
            model_license_url=verification.license_url,
            model_license_requires_acceptance=(
                verification.license_requires_acceptance
            ),
            model_license_accepted=verification.license_accepted,
            model_checksum_verified=verification.checksum_verified,
            model_checksum_failures=list(verification.checksum_failures),
            model_declared_file_count=verification.declared_file_count,
            model_verified_file_count=verification.verified_file_count,
            model_size_mb=model_size_mb,
            model_install_state=install_state,
            min_disk_free_mb=self.settings.min_disk_free_mb,
        )

    def _torch_snapshot(self) -> TorchSnapshot:
        try:
            import torch
        except ImportError:
            return TorchSnapshot(False, False, 0, None, None, False)
        cuda_available = bool(torch.cuda.is_available())
        cuda_device_count = torch.cuda.device_count() if cuda_available else 0
        gpu_name = None
        vram_total_mb = None
        if cuda_available and cuda_device_count > 0:
            gpu_name = torch.cuda.get_device_name(0)
            properties = torch.cuda.get_device_properties(0)
            vram_total_mb = round(properties.total_memory / 1024 / 1024)
        mps_backend = getattr(getattr(torch, "backends", None), "mps", None)
        mps_available = bool(mps_backend and mps_backend.is_available())
        return TorchSnapshot(
            True,
            cuda_available,
            cuda_device_count,
            gpu_name,
            vram_total_mb,
            mps_available,
        )

    def _hardware_status(self, torch: TorchSnapshot) -> tuple[str, bool, str]:
        device = self.settings.device.lower()
        if device.startswith("cuda"):
            return self._cuda_status(torch)
        if device == "mps":
            if torch.mps_available:
                return "apple-silicon", True, "Apple Silicon MPS 실행 장치를 확인했습니다."
            return "apple-silicon", False, "Apple Silicon MPS를 사용할 수 없습니다."
        if device == "cpu":
            if self.settings.allow_cpu:
                return "cpu", True, "CPU 저속 실행을 명시적으로 허용했습니다."
            return "cpu", False, "CPU 저속 실행이 비활성화됐습니다."
        if device == "auto":
            if torch.cuda_available:
                return self._cuda_status(torch)
            if torch.mps_available:
                return "apple-silicon", True, "자동으로 Apple Silicon MPS를 선택합니다."
            if self.settings.allow_cpu:
                return "cpu", True, "GPU가 없어 CPU 저속 실행을 선택합니다."
            return "unavailable", False, "CUDA·MPS가 없고 CPU 저속 실행도 비활성화됐습니다."
        return "unavailable", False, f"지원하지 않는 실행 장치입니다: {self.settings.device}"

    def _cuda_status(self, torch: TorchSnapshot) -> tuple[str, bool, str]:
        if not torch.cuda_available:
            return "cuda", False, "CUDA GPU를 찾지 못했습니다."
        if (
            torch.vram_total_mb is not None
            and torch.vram_total_mb < self.settings.min_vram_mb
        ):
            return (
                "cuda",
                False,
                f"VRAM {torch.vram_total_mb}MB는 최소 "
                f"{self.settings.min_vram_mb}MB보다 작습니다.",
            )
        detail = torch.gpu_name or "CUDA GPU"
        return "cuda", True, f"{detail} 실행 장치를 확인했습니다."

    def _preflight_issue(
        self,
        model_path: Path | None,
        model_exists: bool,
        missing_files: list[str],
        verification: ModelVerification,
        hardware_supported: bool,
        hardware_reason: str,
        disk_free_mb: int | None,
    ) -> str | None:
        if model_path is None:
            return "SORION_WORKER_MODEL_PATH가 필요합니다."
        if not model_exists:
            return f"모델 경로를 찾을 수 없습니다: {model_path}"
        if missing_files:
            return "필수 모델 파일이 없습니다: " + ", ".join(missing_files)
        if self.settings.require_model_manifest and verification.state == "not-configured":
            return "SORION_WORKER_MODEL_MANIFEST_PATH가 필요합니다."
        if verification.state not in {"verified", "not-configured"}:
            return verification.reason
        if not self.settings.auth_ready:
            return "production Worker에는 서비스 토큰과 서명 비밀키가 모두 필요합니다."
        if not hardware_supported:
            return hardware_reason
        if disk_free_mb is not None and disk_free_mb < self.settings.min_disk_free_mb:
            return (
                f"Worker 디스크 여유 {disk_free_mb}MB는 최소 "
                f"{self.settings.min_disk_free_mb}MB보다 작습니다."
            )
        return None

    def _install_state(
        self,
        model_path: Path | None,
        model_exists: bool,
        missing_files: list[str],
        verification: ModelVerification,
        hardware_supported: bool,
        disk_free_mb: int | None,
        adapter_loaded: bool,
    ) -> str:
        if model_path is None:
            return "model-path-required"
        if not model_exists:
            return "model-path-missing"
        if missing_files:
            return "model-files-missing"
        if self.settings.require_model_manifest and verification.state == "not-configured":
            return "manifest-required"
        if verification.state not in {"verified", "not-configured"}:
            return verification.state
        if not self.settings.auth_ready:
            return "security-required"
        if not hardware_supported:
            return "hardware-blocked"
        if disk_free_mb is not None and disk_free_mb < self.settings.min_disk_free_mb:
            return "disk-insufficient"
        if not adapter_loaded:
            return "adapter-unavailable"
        if verification.state == "not-configured":
            return "legacy-unverified"
        return "ready"

    def _ready_reason(self, verification: ModelVerification, hardware_profile: str) -> str:
        if verification.checksum_verified:
            return (
                f"{verification.model_id} {verification.model_version} 무결성과 "
                f"{hardware_profile} 실행 환경이 준비되었습니다."
            )
        return f"CosyVoice adapter와 모델이 {hardware_profile} 환경에서 준비되었습니다."

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
