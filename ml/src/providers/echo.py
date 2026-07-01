"""File-based deterministic provider with no inference."""

from __future__ import annotations

import hashlib
from pathlib import Path

from src.providers.base import Provider
from src.providers.models import ProviderRequest, ProviderResult


def _hash_file(label: str, asset_path: str) -> str:
    path = Path(asset_path)
    if not path.is_file():
        raise FileNotFoundError(f"{label} file was not found: {path}")
    return hashlib.sha256(path.read_bytes()).hexdigest()


class EchoProvider(Provider):
    """Verify local inputs and return a content-derived placeholder result."""

    provider_id = "echo"
    provider_version = "1.0.0"

    def execute(self, request: ProviderRequest) -> ProviderResult:
        """Hash referenced files and return a deterministic placeholder."""
        asset_hashes = [
            _hash_file("Person image", request.person_asset),
            _hash_file("Garment image", request.garment_asset),
        ]
        if request.mask_asset is not None:
            asset_hashes.append(_hash_file("Mask image", request.mask_asset))

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
        result_id = hashlib.sha256(identity.encode("utf-8")).hexdigest()[:16]

        return ProviderResult(
            request_id=request.request_id,
            status="succeeded",
            provider_id=self.provider_id,
            provider_version=self.provider_version,
            result_assets=(f"echo://placeholder/{result_id}.json",),
            seed=request.seed,
            width=request.target_width,
            height=request.target_height,
            warnings=("placeholder_output",),
        )
