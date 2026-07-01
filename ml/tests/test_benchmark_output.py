"""Smoke tests for benchmark result and artifact persistence."""

from __future__ import annotations

import json
import tempfile
import unittest
from pathlib import Path

from src.benchmark import run_provider_benchmark
from src.providers.dummy import DummyProvider
from src.providers.echo import EchoProvider
from src.providers.models import ProviderRequest


def _request(
    *,
    person_asset: str = "mock/person.png",
    garment_asset: str = "mock/garment.png",
) -> ProviderRequest:
    return ProviderRequest(
        request_id="benchmark-smoke",
        person_asset=person_asset,
        garment_asset=garment_asset,
        garment_category="upper_body",
        target_width=512,
        target_height=768,
        seed=7,
    )


class BenchmarkOutputTests(unittest.TestCase):
    """Verify normalized results and artifacts are persisted."""

    def test_writes_success_result_and_provider_artifact(self) -> None:
        with tempfile.TemporaryDirectory() as temporary_directory:
            output_dir = Path(temporary_directory)
            result = run_provider_benchmark(
                DummyProvider(),
                _request(),
                output_dir,
            )

            result_files = tuple(output_dir.glob("*.benchmark-result.json"))
            artifact_files = tuple(output_dir.glob("*.dummy-output.json"))
            stored_result = json.loads(result_files[0].read_text(encoding="utf-8"))
            stored_artifact = json.loads(artifact_files[0].read_text(encoding="utf-8"))

        self.assertEqual(result.status, "succeeded")
        self.assertEqual(len(result_files), 1)
        self.assertEqual(len(artifact_files), 1)
        self.assertEqual(stored_result["requestId"], "benchmark-smoke")
        self.assertEqual(stored_result["provider"], "dummy")
        self.assertEqual(stored_artifact["provider_id"], "dummy")

    def test_writes_failure_result_when_provider_rejects_missing_file(self) -> None:
        with tempfile.TemporaryDirectory() as temporary_directory:
            output_dir = Path(temporary_directory)
            result = run_provider_benchmark(
                EchoProvider(),
                _request(
                    person_asset=str(output_dir / "missing-person.png"),
                    garment_asset=str(output_dir / "missing-garment.png"),
                ),
                output_dir,
            )

            result_files = tuple(output_dir.glob("*.benchmark-result.json"))
            artifact_files = tuple(output_dir.glob("*.echo-output.json"))
            stored_result = json.loads(result_files[0].read_text(encoding="utf-8"))

        self.assertEqual(result.status, "failed")
        self.assertEqual(len(result_files), 1)
        self.assertEqual(len(artifact_files), 0)
        self.assertIsNone(stored_result["outputPath"])
        self.assertIn("FileNotFoundError", stored_result["error"])


if __name__ == "__main__":
    unittest.main()
