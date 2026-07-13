"""CLI regression tests for the ML workspace entrypoint."""

from __future__ import annotations

import contextlib
import io
import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from src import main as cli
from src.adapters.models import ModelRequest, ModelResult


class _FakeAdapter:
    def __init__(self) -> None:
        self.requests: list[ModelRequest] = []

    def execute(self, request: ModelRequest) -> ModelResult:
        self.requests.append(request)
        return ModelResult(
            output_id="catvton-smoke-001",
            width=request.target_width,
            height=request.target_height,
            seed=request.seed,
            warnings=("research_only",),
            status="succeeded",
            output_path=request.output_path,
            duration_ms=57_000.0,
            model_id="catvton",
            model_version="research-only",
            metadata=(("adapterId", "catvton-research"),),
        )


class _FakeRegistry:
    def __init__(self, adapter: _FakeAdapter) -> None:
        self.adapter = adapter
        self.requested_adapter_id: str | None = None

    def get(self, adapter_id: str) -> _FakeAdapter:
        self.requested_adapter_id = adapter_id
        return self.adapter


class MainCliTests(unittest.TestCase):
    """Verify CatVTON adapter CLI behavior without model execution."""

    def test_catvton_research_help_lists_expected_options(self) -> None:
        stdout = io.StringIO()

        with self.assertRaises(SystemExit) as error, contextlib.redirect_stdout(stdout):
            cli.main(["catvton-research", "--help"])

        self.assertEqual(error.exception.code, 0)
        help_text = stdout.getvalue()
        self.assertIn("--person", help_text)
        self.assertIn("--garment", help_text)
        self.assertIn("--cloth-type", help_text)
        self.assertIn("--base-model-path", help_text)
        self.assertIn("--resume-path", help_text)

    def test_catvton_research_command_executes_mocked_adapter(self) -> None:
        fake_adapter = _FakeAdapter()
        fake_registry = _FakeRegistry(fake_adapter)

        with tempfile.TemporaryDirectory() as temporary_directory:
            root = Path(temporary_directory)
            person_path = root / "person.png"
            garment_path = root / "garment.png"
            output_path = root / "catvton-smoke-001.png"
            person_path.write_bytes(b"person-fixture")
            garment_path.write_bytes(b"garment-fixture")
            stdout = io.StringIO()

            with (
                patch("src.main.create_adapter_registry", return_value=fake_registry),
                contextlib.redirect_stdout(stdout),
            ):
                exit_code = cli.main(
                    [
                        "catvton-research",
                        "--person",
                        str(person_path),
                        "--garment",
                        str(garment_path),
                        "--cloth-type",
                        "upper",
                        "--output",
                        str(output_path),
                        "--seed",
                        "42",
                        "--inference-steps",
                        "30",
                        "--guidance-scale",
                        "2.5",
                        "--width",
                        "768",
                        "--height",
                        "1024",
                        "--device",
                        "cuda",
                        "--base-model-path",
                        "runwayml/stable-diffusion-inpainting",
                        "--resume-path",
                        "zhengchong/CatVTON",
                    ]
                )

        payload = json.loads(stdout.getvalue())
        self.assertEqual(exit_code, 0)
        self.assertEqual(fake_registry.requested_adapter_id, "catvton-research")
        self.assertEqual(len(fake_adapter.requests), 1)
        self.assertEqual(fake_adapter.requests[0].person_path, person_path)
        self.assertEqual(fake_adapter.requests[0].garment_path, garment_path)
        self.assertEqual(fake_adapter.requests[0].garment_category, "upper")
        self.assertEqual(fake_adapter.requests[0].target_width, 768)
        self.assertEqual(fake_adapter.requests[0].target_height, 1024)
        self.assertEqual(fake_adapter.requests[0].seed, 42)
        self.assertEqual(fake_adapter.requests[0].output_path, output_path)
        self.assertEqual(payload["status"], "succeeded")
        self.assertEqual(payload["modelId"], "catvton")
        self.assertEqual(payload["modelVersion"], "research-only")
        self.assertEqual(payload["outputPath"], str(output_path))
        self.assertEqual(payload["warnings"], ["research_only"])


if __name__ == "__main__":
    unittest.main()
