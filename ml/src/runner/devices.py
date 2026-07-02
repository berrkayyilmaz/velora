"""Optional Torch-aware local device detection."""

from __future__ import annotations

import platform as platform_module
from dataclasses import dataclass
from importlib import import_module
from importlib.util import find_spec
from typing import Literal, Protocol, TypedDict, cast

TorchStatus = Literal[
    "torch_not_installed",
    "cuda_available",
    "cuda_unavailable",
    "torch_error",
]
DeviceKind = Literal["cuda", "cpu"]


class _CudaApi(Protocol):
    def is_available(self) -> bool:
        """Return whether CUDA can be used."""

    def get_device_name(self, device: int) -> str:
        """Return the selected CUDA device name."""


class _TorchApi(Protocol):
    cuda: _CudaApi


class DeviceInfoPayload(TypedDict):
    """JSON-serializable device information schema."""

    pythonVersion: str
    operatingSystem: str
    platform: str
    torchStatus: TorchStatus
    cudaAvailable: bool
    gpuName: str | None
    device: DeviceKind


@dataclass(frozen=True, slots=True)
class DeviceInfo:
    """Detected local Python, platform, and compute capabilities."""

    python_version: str
    operating_system: str
    platform: str
    torch_status: TorchStatus
    cuda_available: bool
    gpu_name: str | None
    device: DeviceKind

    def to_payload(self) -> DeviceInfoPayload:
        """Return the camelCase device information schema."""
        return {
            "pythonVersion": self.python_version,
            "operatingSystem": self.operating_system,
            "platform": self.platform,
            "torchStatus": self.torch_status,
            "cudaAvailable": self.cuda_available,
            "gpuName": self.gpu_name,
            "device": self.device,
        }


def _device_info(
    *,
    torch_status: TorchStatus,
    cuda_available: bool = False,
    gpu_name: str | None = None,
) -> DeviceInfo:
    return DeviceInfo(
        python_version=platform_module.python_version(),
        operating_system=platform_module.system(),
        platform=platform_module.platform(),
        torch_status=torch_status,
        cuda_available=cuda_available,
        gpu_name=gpu_name,
        device="cuda" if cuda_available else "cpu",
    )


def detect_devices() -> DeviceInfo:
    """Detect local compute support without requiring Torch."""
    try:
        torch_spec = find_spec("torch")
    except (ImportError, ValueError):
        return _device_info(torch_status="torch_error")

    if torch_spec is None:
        return _device_info(torch_status="torch_not_installed")

    try:
        torch_api = cast(_TorchApi, import_module("torch"))
        cuda_available = torch_api.cuda.is_available()
    except (AttributeError, ImportError, RuntimeError):
        return _device_info(torch_status="torch_error")

    if not cuda_available:
        return _device_info(torch_status="cuda_unavailable")

    try:
        gpu_name = torch_api.cuda.get_device_name(0)
    except (AttributeError, RuntimeError):
        gpu_name = None

    return _device_info(
        torch_status="cuda_available",
        cuda_available=True,
        gpu_name=gpu_name,
    )
