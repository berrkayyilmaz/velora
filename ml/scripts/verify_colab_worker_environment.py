"""Verify a research-only Colab environment for the Velora remote CatVTON worker."""

from __future__ import annotations

import argparse
import importlib
import json
import sys
import urllib.error
import urllib.request
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Protocol


class VerificationError(RuntimeError):
    """Raised when a required Colab worker condition is not satisfied."""


class _CudaModule(Protocol):
    def is_available(self) -> bool:
        """Return whether CUDA is available."""

    def get_device_name(self, device: int) -> str:
        """Return the CUDA device name."""


class _TorchVersion(Protocol):
    cuda: str | None


class _TorchModule(Protocol):
    cuda: _CudaModule
    version: _TorchVersion
    __version__: str


@dataclass(frozen=True)
class VerificationConfig:
    """Verification inputs for one Colab worker environment."""

    velora_root: Path
    catvton_root: Path
    person_image: Path
    garment_image: Path
    worker_health_url: str
    health_timeout_seconds: float


@dataclass(frozen=True)
class VerificationResult:
    """Serializable verification result."""

    velora_root: str
    catvton_root: str
    person_image: str
    garment_image: str
    worker_health_url: str
    torch_version: str
    cuda_version: str
    gpu_name: str
    worker_health_ok: bool


def build_parser() -> argparse.ArgumentParser:
    """Create the CLI parser."""

    parser = argparse.ArgumentParser(
        description="Verify Colab prerequisites for the Velora remote CatVTON worker."
    )
    parser.add_argument("--velora-root", type=Path, default=Path("/content/velora"))
    parser.add_argument("--catvton-root", type=Path, default=Path("/content/CatVTON"))
    parser.add_argument("--person-image", type=Path, required=True)
    parser.add_argument("--garment-image", type=Path, required=True)
    parser.add_argument("--worker-health-url", default="http://127.0.0.1:4100/health")
    parser.add_argument("--health-timeout-seconds", type=float, default=10.0)
    return parser


def config_from_args(args: argparse.Namespace) -> VerificationConfig:
    """Build a verification config from parsed CLI args."""

    return VerificationConfig(
        velora_root=args.velora_root,
        catvton_root=args.catvton_root,
        person_image=args.person_image,
        garment_image=args.garment_image,
        worker_health_url=args.worker_health_url,
        health_timeout_seconds=args.health_timeout_seconds,
    )


def verify_repository_paths(config: VerificationConfig) -> None:
    """Verify Velora and CatVTON repository paths are present."""

    required_paths = {
        "Velora repository": config.velora_root,
        "Velora ai-worker": config.velora_root / "ai-worker",
        "Velora ml workspace": config.velora_root / "ml",
        "CatVTON repository": config.catvton_root,
    }

    for label, path in required_paths.items():
        if not path.exists():
            raise VerificationError(f"{label} is missing: {path}")
        if not path.is_dir():
            raise VerificationError(f"{label} is not a directory: {path}")


def verify_input_files(config: VerificationConfig) -> None:
    """Verify research input files exist."""

    for label, path in {
        "Person image": config.person_image,
        "Garment image": config.garment_image,
    }.items():
        if not path.exists():
            raise VerificationError(f"{label} is missing: {path}")
        if not path.is_file():
            raise VerificationError(f"{label} is not a file: {path}")


def load_torch_module() -> _TorchModule:
    """Import Torch lazily."""

    try:
        module = importlib.import_module("torch")
    except ImportError as error:
        raise VerificationError("Torch is not installed in the active runtime.") from error

    return module


def verify_cuda(torch_module: _TorchModule | None = None) -> tuple[str, str, str]:
    """Verify CUDA is available and Torch is not CPU-only."""

    torch_runtime = torch_module or load_torch_module()
    torch_version = torch_runtime.__version__
    cuda_version = torch_runtime.version.cuda

    if cuda_version is None or cuda_version.strip() == "":
        raise VerificationError("Torch appears to be CPU-only; CUDA build is required.")

    if not torch_runtime.cuda.is_available():
        raise VerificationError("CUDA is unavailable in Torch. Select a GPU runtime.")

    return torch_version, cuda_version, torch_runtime.cuda.get_device_name(0)


def verify_catvton_imports(catvton_root: Path) -> None:
    """Verify core CatVTON modules import from the checked-out repository."""

    if str(catvton_root) not in sys.path:
        sys.path.insert(0, str(catvton_root))

    for module_name in (
        "model.pipeline",
        "model.cloth_masker",
        "utils",
    ):
        try:
            importlib.import_module(module_name)
        except Exception as error:  # noqa: BLE001 - report import root cause clearly.
            raise VerificationError(f"CatVTON import failed for {module_name}: {error}") from error


def verify_worker_health(url: str, timeout_seconds: float) -> None:
    """Verify the AI worker health endpoint responds with HTTP 200."""

    try:
        with urllib.request.urlopen(url, timeout=timeout_seconds) as response:
            if response.status != 200:
                raise VerificationError(f"Worker health failed with HTTP {response.status}.")
    except urllib.error.URLError as error:
        raise VerificationError(f"Worker health check failed: {error}") from error


def verify_environment(config: VerificationConfig) -> VerificationResult:
    """Run all verification checks and return a summary."""

    verify_repository_paths(config)
    verify_input_files(config)
    torch_version, cuda_version, gpu_name = verify_cuda()
    verify_catvton_imports(config.catvton_root)
    verify_worker_health(config.worker_health_url, config.health_timeout_seconds)

    return VerificationResult(
        velora_root=str(config.velora_root),
        catvton_root=str(config.catvton_root),
        person_image=str(config.person_image),
        garment_image=str(config.garment_image),
        worker_health_url=config.worker_health_url,
        torch_version=torch_version,
        cuda_version=cuda_version,
        gpu_name=gpu_name,
        worker_health_ok=True,
    )


def main(argv: list[str] | None = None) -> int:
    """Execute environment verification."""

    parser = build_parser()
    config = config_from_args(parser.parse_args(argv))

    try:
        result = verify_environment(config)
    except VerificationError as error:
        print(f"COLAB_WORKER_ENVIRONMENT_INVALID: {error}", file=sys.stderr)
        return 1

    print(json.dumps(asdict(result), indent=2, sort_keys=True))
    print("COLAB_WORKER_ENVIRONMENT_OK")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
