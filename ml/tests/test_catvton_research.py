"""Tests for research-only CatVTON direct inference configuration."""

from __future__ import annotations

import tempfile
import unittest
from pathlib import Path

from src.providers.catvton_research import (
    CatVTONResearchConfig,
    CatVTONResearchError,
    build_parser,
    config_from_args,
    validate_config,
)


class CatVTONResearchConfigTests(unittest.TestCase):
    """Validate direct CatVTON config without loading model dependencies."""

    def test_accepts_valid_config(self) -> None:
        with tempfile.TemporaryDirectory() as temporary_directory:
            root = Path(temporary_directory)
            person_path = root / "person.png"
            garment_path = root / "garment.png"
            person_path.write_bytes(b"person-fixture")
            garment_path.write_bytes(b"garment-fixture")
            config = CatVTONResearchConfig(
                person_image_path=person_path,
                garment_image_path=garment_path,
                cloth_type="upper",
                output_path=root / "output.png",
                seed=42,
                inference_steps=50,
                guidance_scale=2.5,
            )

            self.assertEqual(validate_config(config), config)

    def test_rejects_missing_person_image(self) -> None:
        with tempfile.TemporaryDirectory() as temporary_directory:
            root = Path(temporary_directory)
            garment_path = root / "garment.png"
            garment_path.write_bytes(b"garment-fixture")
            config = CatVTONResearchConfig(
                person_image_path=root / "missing-person.png",
                garment_image_path=garment_path,
                cloth_type="upper",
                output_path=root / "output.png",
                seed=42,
                inference_steps=50,
                guidance_scale=2.5,
            )

            with self.assertRaisesRegex(CatVTONResearchError, "person_image_path"):
                validate_config(config)

    def test_rejects_non_positive_inference_steps(self) -> None:
        with tempfile.TemporaryDirectory() as temporary_directory:
            root = Path(temporary_directory)
            person_path = root / "person.png"
            garment_path = root / "garment.png"
            person_path.write_bytes(b"person-fixture")
            garment_path.write_bytes(b"garment-fixture")
            config = CatVTONResearchConfig(
                person_image_path=person_path,
                garment_image_path=garment_path,
                cloth_type="upper",
                output_path=root / "output.png",
                seed=42,
                inference_steps=0,
                guidance_scale=2.5,
            )

            with self.assertRaisesRegex(CatVTONResearchError, "inference_steps"):
                validate_config(config)

    def test_rejects_dimensions_not_divisible_by_eight(self) -> None:
        with tempfile.TemporaryDirectory() as temporary_directory:
            root = Path(temporary_directory)
            person_path = root / "person.png"
            garment_path = root / "garment.png"
            person_path.write_bytes(b"person-fixture")
            garment_path.write_bytes(b"garment-fixture")
            config = CatVTONResearchConfig(
                person_image_path=person_path,
                garment_image_path=garment_path,
                cloth_type="upper",
                output_path=root / "output.png",
                seed=42,
                inference_steps=50,
                guidance_scale=2.5,
                width=770,
                height=1024,
            )

            with self.assertRaisesRegex(CatVTONResearchError, "divisible by 8"):
                validate_config(config)

    def test_builds_config_from_cli_args(self) -> None:
        with tempfile.TemporaryDirectory() as temporary_directory:
            root = Path(temporary_directory)
            person_path = root / "person.png"
            garment_path = root / "garment.png"
            output_path = root / "result.png"
            person_path.write_bytes(b"person-fixture")
            garment_path.write_bytes(b"garment-fixture")
            parser = build_parser()
            args = parser.parse_args(
                [
                    "--person",
                    str(person_path),
                    "--garment",
                    str(garment_path),
                    "--cloth-type",
                    "overall",
                    "--output",
                    str(output_path),
                    "--seed",
                    "7",
                    "--inference-steps",
                    "25",
                    "--guidance-scale",
                    "3.0",
                    "--mixed-precision",
                    "fp16",
                ]
            )

            config = config_from_args(args)

        self.assertEqual(config.cloth_type, "overall")
        self.assertEqual(config.output_path, output_path)
        self.assertEqual(config.seed, 7)
        self.assertEqual(config.inference_steps, 25)
        self.assertEqual(config.guidance_scale, 3.0)


if __name__ == "__main__":
    unittest.main()
