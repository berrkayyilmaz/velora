"""Typed benchmark dataset manifest loader."""

from __future__ import annotations

import json
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Literal, cast

ExpectedCategory = Literal["upper_body", "lower_body", "dress"]
SampleType = Literal["smoke", "quality", "stress"]

_EXPECTED_CATEGORIES = {"upper_body", "lower_body", "dress"}
_SAMPLE_TYPES = {"smoke", "quality", "stress"}
_IDENTIFIER_PATTERN = re.compile(r"^[a-z0-9][a-z0-9_-]*$")


class DatasetManifestError(ValueError):
    """Raised when a dataset manifest is missing or invalid."""


@dataclass(frozen=True, slots=True)
class BenchmarkSample:
    """One benchmark person and garment pairing."""

    sample_id: str
    person_image_path: Path
    garment_image_path: Path
    mask_image_path: Path | None
    expected_category: ExpectedCategory
    sample_type: SampleType


@dataclass(frozen=True, slots=True)
class BenchmarkDatasetManifest:
    """Validated benchmark dataset manifest."""

    schema_version: int
    dataset_id: str
    samples: tuple[BenchmarkSample, ...]


def _validate_object(field: str, value: object) -> dict[str, object]:
    if not isinstance(value, dict) or not all(isinstance(key, str) for key in value):
        raise DatasetManifestError(f"{field} must be an object")
    return cast(dict[str, object], value)


def _validate_fields(
    name: str,
    data: dict[str, object],
    required_fields: set[str],
    optional_fields: set[str] | None = None,
) -> None:
    allowed_fields = required_fields | (optional_fields or set())
    missing_fields = sorted(required_fields - data.keys())
    unknown_fields = sorted(data.keys() - allowed_fields)
    if missing_fields:
        raise DatasetManifestError(f"{name} is missing fields: {', '.join(missing_fields)}")
    if unknown_fields:
        raise DatasetManifestError(f"{name} has unknown fields: {', '.join(unknown_fields)}")


def _validate_identifier(field: str, value: object) -> str:
    if not isinstance(value, str) or not _IDENTIFIER_PATTERN.fullmatch(value):
        raise DatasetManifestError(
            f"{field} must contain only lowercase letters, numbers, hyphens, or underscores"
        )
    return value


def _validate_image_path(field: str, value: object) -> Path:
    if not isinstance(value, str) or not value.strip():
        raise DatasetManifestError(f"{field} must be a non-empty string")

    path = Path(value)
    if path.is_absolute() or ".." in path.parts:
        raise DatasetManifestError(f"{field} must be a safe relative path")
    if path.suffix.lower() not in {".jpeg", ".jpg", ".png"}:
        raise DatasetManifestError(f"{field} must reference a PNG or JPEG image")
    return path


def _validate_category(field: str, value: object) -> ExpectedCategory:
    if not isinstance(value, str) or value not in _EXPECTED_CATEGORIES:
        raise DatasetManifestError(
            f"{field} must be one of: {', '.join(sorted(_EXPECTED_CATEGORIES))}"
        )
    return cast(ExpectedCategory, value)


def _validate_sample_type(field: str, value: object) -> SampleType:
    if not isinstance(value, str) or value not in _SAMPLE_TYPES:
        raise DatasetManifestError(f"{field} must be one of: {', '.join(sorted(_SAMPLE_TYPES))}")
    return cast(SampleType, value)


def _parse_sample(value: object, index: int) -> BenchmarkSample:
    field = f"samples[{index}]"
    sample = _validate_object(field, value)
    _validate_fields(
        field,
        sample,
        {
            "id",
            "personImagePath",
            "garmentImagePath",
            "expectedCategory",
            "sampleType",
        },
        {"maskImagePath"},
    )
    mask_value = sample.get("maskImagePath")

    return BenchmarkSample(
        sample_id=_validate_identifier(f"{field}.id", sample["id"]),
        person_image_path=_validate_image_path(
            f"{field}.personImagePath",
            sample["personImagePath"],
        ),
        garment_image_path=_validate_image_path(
            f"{field}.garmentImagePath",
            sample["garmentImagePath"],
        ),
        mask_image_path=(
            _validate_image_path(f"{field}.maskImagePath", mask_value)
            if mask_value is not None
            else None
        ),
        expected_category=_validate_category(
            f"{field}.expectedCategory",
            sample["expectedCategory"],
        ),
        sample_type=_validate_sample_type(f"{field}.sampleType", sample["sampleType"]),
    )


def load_dataset_manifest(path: Path) -> BenchmarkDatasetManifest:
    """Load and validate one benchmark dataset manifest."""
    try:
        raw_manifest: object = json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError as error:
        raise DatasetManifestError(f"Manifest file was not found: {path}") from error
    except (OSError, json.JSONDecodeError) as error:
        raise DatasetManifestError(f"Manifest file could not be read: {path}: {error}") from error

    manifest = _validate_object("manifest", raw_manifest)
    _validate_fields("manifest", manifest, {"schemaVersion", "datasetId", "samples"})

    schema_version = manifest["schemaVersion"]
    if isinstance(schema_version, bool) or schema_version != 1:
        raise DatasetManifestError("schemaVersion must be 1")

    samples_value = manifest["samples"]
    if not isinstance(samples_value, list) or not samples_value:
        raise DatasetManifestError("samples must be a non-empty array")

    samples = tuple(_parse_sample(sample, index) for index, sample in enumerate(samples_value))
    sample_ids = [sample.sample_id for sample in samples]
    if len(sample_ids) != len(set(sample_ids)):
        raise DatasetManifestError("sample ids must be unique")

    return BenchmarkDatasetManifest(
        schema_version=1,
        dataset_id=_validate_identifier("datasetId", manifest["datasetId"]),
        samples=samples,
    )
