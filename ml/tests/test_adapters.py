"""Smoke tests for model adapter behavior and registration."""

from __future__ import annotations

import tempfile
import unittest
from pathlib import Path

from src.adapters.catvton import CATVTON_RESEARCH_WARNING, CatVTONAdapter
from src.adapters.dummy import DummyModelAdapter
from src.adapters.models import ModelRequest
from src.adapters.registry import create_adapter_registry
from src.providers.catvton_research import CatVTONResearchConfig, CatVTONResearchResult


class ModelAdapterTests(unittest.TestCase):
    """Verify the deterministic local adapter boundary."""

    def test_dummy_adapter_returns_deterministic_result(self) -> None:
        with tempfile.TemporaryDirectory() as temporary_directory:
            root = Path(temporary_directory)
            person_path = root / "person.png"
            garment_path = root / "garment.png"
            person_path.write_bytes(b"person-fixture")
            garment_path.write_bytes(b"garment-fixture")
            request = ModelRequest(
                request_id="adapter-smoke",
                person_path=person_path,
                garment_path=garment_path,
                mask_path=None,
                garment_category="upper_body",
                target_width=512,
                target_height=768,
                seed=7,
            )
            adapter = DummyModelAdapter()

            first_result = adapter.execute(request)
            second_result = adapter.execute(request)

        self.assertEqual(first_result, second_result)
        self.assertEqual(first_result.width, 512)
        self.assertEqual(first_result.height, 768)
        self.assertEqual(first_result.seed, 7)
        self.assertEqual(first_result.status, "succeeded")

    def test_catvton_adapter_maps_request_into_research_config(self) -> None:
        captured_configs: list[CatVTONResearchConfig] = []

        def _runner(config: CatVTONResearchConfig) -> CatVTONResearchResult:
            captured_configs.append(config)
            return CatVTONResearchResult(
                output_path=config.output_path,
                mask_generated=True,
                seed=config.seed,
                inference_steps=config.inference_steps,
                guidance_scale=config.guidance_scale,
                width=config.width,
                height=config.height,
                device=config.device,
            )

        with tempfile.TemporaryDirectory() as temporary_directory:
            root = Path(temporary_directory)
            person_path = root / "person.png"
            garment_path = root / "garment.png"
            output_dir = root / "outputs"
            person_path.write_bytes(b"person-fixture")
            garment_path.write_bytes(b"garment-fixture")
            request = ModelRequest(
                request_id="catvton smoke/001",
                person_path=person_path,
                garment_path=garment_path,
                mask_path=None,
                garment_category="upper_body",
                target_width=768,
                target_height=1024,
                seed=42,
            )
            adapter = CatVTONAdapter(output_dir=output_dir, runner=_runner)

            result = adapter.execute(request)

        self.assertEqual(result.status, "succeeded")
        self.assertEqual(result.output_id, "catvton-smoke-001")
        self.assertEqual(result.output_path, output_dir / "catvton-smoke-001.png")
        self.assertEqual(result.width, 768)
        self.assertEqual(result.height, 1024)
        self.assertEqual(result.seed, 42)
        self.assertEqual(result.model_id, "catvton")
        self.assertEqual(result.model_version, "research-only")
        self.assertIn(CATVTON_RESEARCH_WARNING, result.warnings)
        self.assertIsNone(result.error)
        self.assertGreaterEqual(result.duration_ms, 0)
        self.assertEqual(len(captured_configs), 1)
        self.assertEqual(captured_configs[0].person_image_path, person_path)
        self.assertEqual(captured_configs[0].garment_image_path, garment_path)
        self.assertEqual(captured_configs[0].cloth_type, "upper")
        self.assertEqual(captured_configs[0].inference_steps, 30)
        self.assertEqual(captured_configs[0].guidance_scale, 2.5)

    def test_catvton_adapter_returns_failed_result_for_missing_garment(self) -> None:
        runner_called = False

        def _runner(config: CatVTONResearchConfig) -> CatVTONResearchResult:
            nonlocal runner_called
            runner_called = True
            return CatVTONResearchResult(
                output_path=config.output_path,
                mask_generated=True,
                seed=config.seed,
                inference_steps=config.inference_steps,
                guidance_scale=config.guidance_scale,
                width=config.width,
                height=config.height,
                device=config.device,
            )

        with tempfile.TemporaryDirectory() as temporary_directory:
            root = Path(temporary_directory)
            person_path = root / "person.png"
            person_path.write_bytes(b"person-fixture")
            request = ModelRequest(
                request_id="missing-garment",
                person_path=person_path,
                garment_path=root / "missing.png",
                mask_path=None,
                garment_category="upper_body",
                target_width=768,
                target_height=1024,
                seed=42,
            )
            adapter = CatVTONAdapter(output_dir=root / "outputs", runner=_runner)

            result = adapter.execute(request)

        self.assertFalse(runner_called)
        self.assertEqual(result.status, "failed")
        self.assertIsNone(result.output_path)
        self.assertIn("garment_image_path", result.error or "")
        self.assertIn(CATVTON_RESEARCH_WARNING, result.warnings)

    def test_catvton_adapter_returns_failed_result_for_unknown_category(self) -> None:
        with tempfile.TemporaryDirectory() as temporary_directory:
            root = Path(temporary_directory)
            person_path = root / "person.png"
            garment_path = root / "garment.png"
            person_path.write_bytes(b"person-fixture")
            garment_path.write_bytes(b"garment-fixture")
            request = ModelRequest(
                request_id="unknown-category",
                person_path=person_path,
                garment_path=garment_path,
                mask_path=None,
                garment_category="hat",
                target_width=768,
                target_height=1024,
                seed=42,
            )
            adapter = CatVTONAdapter(output_dir=root / "outputs")

            result = adapter.execute(request)

        self.assertEqual(result.status, "failed")
        self.assertIn("garment_category", result.error or "")

    def test_registry_contains_dummy_adapter(self) -> None:
        registry = create_adapter_registry()

        self.assertEqual(registry.available(), ("catvton-research", "dummy"))
        self.assertIsInstance(registry.get("catvton-research"), CatVTONAdapter)
        self.assertIsInstance(registry.get("dummy"), DummyModelAdapter)

    def test_registry_rejects_unknown_adapter(self) -> None:
        registry = create_adapter_registry()

        with self.assertRaisesRegex(ValueError, "Adapter is not registered"):
            registry.get("missing")


if __name__ == "__main__":
    unittest.main()
