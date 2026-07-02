"""Tests for optional Torch-aware device detection."""

from __future__ import annotations

import unittest
from types import SimpleNamespace
from unittest.mock import patch

from src.runner.devices import detect_devices


class _FakeCuda:
    def __init__(self, available: bool, name: str = "Test GPU") -> None:
        self._available = available
        self._name = name

    def is_available(self) -> bool:
        return self._available

    def get_device_name(self, device: int) -> str:
        if device != 0:
            raise AssertionError("Unexpected test device index")
        return self._name


class DeviceDetectionTests(unittest.TestCase):
    """Verify detection without requiring Torch or GPU hardware."""

    @patch("src.runner.devices.find_spec", return_value=None)
    def test_returns_clean_status_when_torch_is_missing(self, _find_spec: object) -> None:
        result = detect_devices()

        self.assertEqual(result.torch_status, "torch_not_installed")
        self.assertFalse(result.cuda_available)
        self.assertIsNone(result.gpu_name)
        self.assertEqual(result.device, "cpu")

    @patch("src.runner.devices.import_module")
    @patch("src.runner.devices.find_spec", return_value=object())
    def test_uses_cpu_when_cuda_is_unavailable(
        self,
        _find_spec: object,
        import_module_mock: object,
    ) -> None:
        import_module_mock.return_value = SimpleNamespace(cuda=_FakeCuda(False))

        result = detect_devices()

        self.assertEqual(result.torch_status, "cuda_unavailable")
        self.assertFalse(result.cuda_available)
        self.assertEqual(result.device, "cpu")

    @patch("src.runner.devices.import_module")
    @patch("src.runner.devices.find_spec", return_value=object())
    def test_reports_available_gpu(
        self,
        _find_spec: object,
        import_module_mock: object,
    ) -> None:
        import_module_mock.return_value = SimpleNamespace(cuda=_FakeCuda(True, "Synthetic GPU"))

        result = detect_devices()

        self.assertEqual(result.torch_status, "cuda_available")
        self.assertTrue(result.cuda_available)
        self.assertEqual(result.gpu_name, "Synthetic GPU")
        self.assertEqual(result.device, "cuda")


if __name__ == "__main__":
    unittest.main()
