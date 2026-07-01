"""Deterministic file-based model adapter with no inference."""

from __future__ import annotations

import hashlib
from pathlib import Path

from src.adapters.base import ModelAdapter
from src.adapters.models import ModelRequest, ModelResult


def _hash_file(label: str, path: Path) -> str:
    if not path.is_file():
        raise FileNotFoundError(f"{label} file was not found: {path}")
    return hashlib.sha256(path.read_bytes()).hexdigest()


class DummyModelAdapter(ModelAdapter):
    """Verify and hash local inputs without loading a model."""

    adapter_id = "dummy"
    adapter_version = "1.0.0"

    def execute(self, request: ModelRequest) -> ModelResult:
        """Return a deterministic result identifier derived from file content."""
        asset_hashes = [
            _hash_file("Person image", request.person_path),
            _hash_file("Garment image", request.garment_path),
        ]
        if request.mask_path is not None:
            asset_hashes.append(_hash_file("Mask image", request.mask_path))

        identity = "|".join(
            (
                request.request_id,
                *asset_hashes,
                request.garment_category,
                str(request.target_width),
                str(request.target_height),
                str(request.seed),
            )
        )
        output_id = hashlib.sha256(identity.encode("utf-8")).hexdigest()[:16]

        return ModelResult(
            output_id=output_id,
            width=request.target_width,
            height=request.target_height,
            seed=request.seed,
            warnings=("placeholder_output",),
        )
