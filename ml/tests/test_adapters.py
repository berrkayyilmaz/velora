"""Smoke tests for model adapter behavior and registration."""

from __future__ import annotations

import tempfile
import unittest
from pathlib import Path

from src.adapters.dummy import DummyModelAdapter
from src.adapters.models import ModelRequest
from src.adapters.registry import create_adapter_registry


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

    def test_registry_contains_dummy_adapter(self) -> None:
        registry = create_adapter_registry()

        self.assertEqual(registry.available(), ("dummy",))
        self.assertIsInstance(registry.get("dummy"), DummyModelAdapter)

    def test_registry_rejects_unknown_adapter(self) -> None:
        registry = create_adapter_registry()

        with self.assertRaisesRegex(ValueError, "Adapter is not registered"):
            registry.get("missing")


if __name__ == "__main__":
    unittest.main()
