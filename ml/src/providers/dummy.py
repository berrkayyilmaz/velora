"""Deterministic provider implementation with no model inference."""

from __future__ import annotations

import hashlib

from src.providers.base import Provider
from src.providers.models import ProviderRequest, ProviderResult


class DummyProvider(Provider):
    """Return a deterministic mock result without accessing local assets."""

    provider_id = "dummy"
    provider_version = "1.0.0"

    def execute(self, request: ProviderRequest) -> ProviderResult:
        """Build a stable mock result from the normalized request."""
        identity = "|".join(
            (
                request.request_id,
                request.person_asset,
                request.garment_asset,
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
            result_assets=(f"mock://dummy/{result_id}.png",),
            seed=request.seed,
            width=request.target_width,
            height=request.target_height,
            warnings=("mock_result",),
        )
