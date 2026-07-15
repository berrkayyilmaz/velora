"""Tests for Colab remote worker environment verification."""

from __future__ import annotations

import tempfile
import unittest
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import Mock, patch

from scripts.verify_colab_worker_environment import (
    VerificationConfig,
    VerificationError,
    verify_catvton_imports,
    verify_cuda,
    verify_environment,
    verify_input_files,
    verify_repository_paths,
    verify_worker_health,
)


class _FakeCuda:
    def __init__(self, available: bool) -> None:
        self.available = available

    def is_available(self) -> bool:
        return self.available

    def get_device_name(self, device: int) -> str:
        if device != 0:
            raise AssertionError("Unexpected device index")
        return "Tesla T4"


class ColabWorkerEnvironmentTests(unittest.TestCase):
    """Verify environment checks without requiring Colab, CUDA, or CatVTON."""

    def test_repository_checks_require_expected_directories(self) -> None:
        with tempfile.TemporaryDirectory() as temporary_directory:
            root = Path(temporary_directory)
            velora_root = root / "velora"
            catvton_root = root / "CatVTON"
            (velora_root / "ai-worker").mkdir(parents=True)
            (velora_root / "ml").mkdir()
            catvton_root.mkdir()
            config = VerificationConfig(
                velora_root=velora_root,
                catvton_root=catvton_root,
                person_image=root / "person.png",
                garment_image=root / "garment.png",
                worker_health_url="http://127.0.0.1:4100/health",
                health_timeout_seconds=1.0,
            )

            verify_repository_paths(config)

    def test_repository_checks_fail_when_catvton_missing(self) -> None:
        with tempfile.TemporaryDirectory() as temporary_directory:
            root = Path(temporary_directory)
            velora_root = root / "velora"
            (velora_root / "ai-worker").mkdir(parents=True)
            (velora_root / "ml").mkdir()
            config = VerificationConfig(
                velora_root=velora_root,
                catvton_root=root / "missing-CatVTON",
                person_image=root / "person.png",
                garment_image=root / "garment.png",
                worker_health_url="http://127.0.0.1:4100/health",
                health_timeout_seconds=1.0,
            )

            with self.assertRaisesRegex(VerificationError, "CatVTON repository"):
                verify_repository_paths(config)

    def test_input_checks_require_files(self) -> None:
        with tempfile.TemporaryDirectory() as temporary_directory:
            root = Path(temporary_directory)
            person_path = root / "person.png"
            garment_path = root / "garment.png"
            person_path.write_bytes(b"person")
            garment_path.write_bytes(b"garment")
            config = VerificationConfig(
                velora_root=root / "velora",
                catvton_root=root / "CatVTON",
                person_image=person_path,
                garment_image=garment_path,
                worker_health_url="http://127.0.0.1:4100/health",
                health_timeout_seconds=1.0,
            )

            verify_input_files(config)

    def test_cuda_check_rejects_cpu_only_torch(self) -> None:
        torch_module = SimpleNamespace(
            __version__="2.4.0",
            version=SimpleNamespace(cuda=None),
            cuda=_FakeCuda(True),
        )

        with self.assertRaisesRegex(VerificationError, "CPU-only"):
            verify_cuda(torch_module)

    def test_cuda_check_rejects_unavailable_cuda(self) -> None:
        torch_module = SimpleNamespace(
            __version__="2.4.0",
            version=SimpleNamespace(cuda="12.1"),
            cuda=_FakeCuda(False),
        )

        with self.assertRaisesRegex(VerificationError, "CUDA is unavailable"):
            verify_cuda(torch_module)

    def test_cuda_check_accepts_cuda_torch(self) -> None:
        torch_module = SimpleNamespace(
            __version__="2.4.0",
            version=SimpleNamespace(cuda="12.1"),
            cuda=_FakeCuda(True),
        )

        self.assertEqual(verify_cuda(torch_module), ("2.4.0", "12.1", "Tesla T4"))

    @patch("scripts.verify_colab_worker_environment.importlib.import_module")
    def test_catvton_imports_fail_clearly(self, import_module: Mock) -> None:
        import_module.side_effect = ImportError("missing dependency")

        with self.assertRaisesRegex(VerificationError, "CatVTON import failed"):
            verify_catvton_imports(Path("/content/CatVTON"))

    @patch("scripts.verify_colab_worker_environment.urllib.request.urlopen")
    def test_worker_health_uses_http_200(self, urlopen: Mock) -> None:
        response = Mock()
        response.__enter__ = Mock(return_value=SimpleNamespace(status=200))
        response.__exit__ = Mock(return_value=None)
        urlopen.return_value = response

        verify_worker_health("http://127.0.0.1:4100/health", 1.0)

    def test_verify_environment_composes_all_checks(self) -> None:
        with tempfile.TemporaryDirectory() as temporary_directory:
            root = Path(temporary_directory)
            velora_root = root / "velora"
            catvton_root = root / "CatVTON"
            person_path = root / "person.png"
            garment_path = root / "garment.png"
            (velora_root / "ai-worker").mkdir(parents=True)
            (velora_root / "ml").mkdir()
            catvton_root.mkdir()
            person_path.write_bytes(b"person")
            garment_path.write_bytes(b"garment")
            config = VerificationConfig(
                velora_root=velora_root,
                catvton_root=catvton_root,
                person_image=person_path,
                garment_image=garment_path,
                worker_health_url="http://127.0.0.1:4100/health",
                health_timeout_seconds=1.0,
            )

            with (
                patch(
                    "scripts.verify_colab_worker_environment.verify_cuda",
                    return_value=("2.4.0", "12.1", "Tesla T4"),
                ),
                patch("scripts.verify_colab_worker_environment.verify_catvton_imports"),
                patch("scripts.verify_colab_worker_environment.verify_worker_health"),
            ):
                result = verify_environment(config)

            self.assertEqual(result.torch_version, "2.4.0")
            self.assertEqual(result.cuda_version, "12.1")
            self.assertEqual(result.gpu_name, "Tesla T4")
            self.assertTrue(result.worker_health_ok)


if __name__ == "__main__":
    unittest.main()
