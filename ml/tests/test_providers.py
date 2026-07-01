"""Smoke tests for local provider implementations and registration."""

from __future__ import annotations

import tempfile
import unittest
from pathlib import Path

from src.providers.dummy import DummyProvider
from src.providers.echo import EchoProvider
from src.providers.models import ProviderRequest
from src.providers.registry import create_provider_registry


def _request(
    *,
    person_asset: str = "mock/person.png",
    garment_asset: str = "mock/garment.png",
    mask_asset: str | None = None,
) -> ProviderRequest:
    return ProviderRequest(
        request_id="provider-smoke",
        person_asset=person_asset,
        garment_asset=garment_asset,
        garment_category="upper_body",
        target_width=768,
        target_height=1024,
        seed=42,
        mask_asset=mask_asset,
    )


class DummyProviderTests(unittest.TestCase):
    """Verify deterministic in-memory dummy behavior."""

    def test_returns_deterministic_result(self) -> None:
        provider = DummyProvider()
        request = _request()

        first_result = provider.execute(request)
        second_result = provider.execute(request)

        self.assertEqual(first_result, second_result)
        self.assertEqual(first_result.status, "succeeded")
        self.assertEqual(first_result.provider_id, "dummy")
        self.assertTrue(first_result.result_assets[0].startswith("mock://dummy/"))


class EchoProviderTests(unittest.TestCase):
    """Verify deterministic local-file echo behavior."""

    def test_hashes_existing_person_garment_and_mask_files(self) -> None:
        with tempfile.TemporaryDirectory() as temporary_directory:
            root = Path(temporary_directory)
            person_path = root / "person.png"
            garment_path = root / "garment.png"
            mask_path = root / "mask.png"
            person_path.write_bytes(b"person-fixture")
            garment_path.write_bytes(b"garment-fixture")
            mask_path.write_bytes(b"mask-fixture")
            request = _request(
                person_asset=str(person_path),
                garment_asset=str(garment_path),
                mask_asset=str(mask_path),
            )
            provider = EchoProvider()

            first_result = provider.execute(request)
            second_result = provider.execute(request)

        self.assertEqual(first_result, second_result)
        self.assertEqual(first_result.provider_id, "echo")
        self.assertTrue(first_result.result_assets[0].startswith("echo://placeholder/"))

    def test_rejects_missing_referenced_file(self) -> None:
        with tempfile.TemporaryDirectory() as temporary_directory:
            root = Path(temporary_directory)
            person_path = root / "person.png"
            person_path.write_bytes(b"person-fixture")
            request = _request(
                person_asset=str(person_path),
                garment_asset=str(root / "missing-garment.png"),
            )

            with self.assertRaisesRegex(
                FileNotFoundError,
                "Garment image file was not found",
            ):
                EchoProvider().execute(request)


class ProviderRegistryTests(unittest.TestCase):
    """Verify default provider registration and lookup behavior."""

    def test_registers_dummy_and_echo_providers(self) -> None:
        registry = create_provider_registry()

        self.assertEqual(registry.available(), ("dummy", "echo"))
        self.assertIsInstance(registry.get("dummy"), DummyProvider)
        self.assertIsInstance(registry.get("echo"), EchoProvider)

    def test_rejects_unknown_provider(self) -> None:
        registry = create_provider_registry()

        with self.assertRaisesRegex(ValueError, "Provider is not registered"):
            registry.get("missing")


if __name__ == "__main__":
    unittest.main()
