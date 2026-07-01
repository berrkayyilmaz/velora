"""File-based provider backed by a model adapter."""

from __future__ import annotations

from pathlib import Path

from src.adapters import ModelAdapter, ModelRequest, create_adapter_registry
from src.providers.base import Provider
from src.providers.models import ProviderRequest, ProviderResult


class EchoProvider(Provider):
    """Map provider requests through a local model adapter."""

    provider_id = "echo"
    provider_version = "1.0.0"

    def __init__(self, adapter: ModelAdapter | None = None) -> None:
        self._adapter = adapter or create_adapter_registry().get("dummy")

    def execute(self, request: ProviderRequest) -> ProviderResult:
        """Execute the configured adapter and map its normalized result."""
        model_result = self._adapter.execute(
            ModelRequest(
                request_id=request.request_id,
                person_path=Path(request.person_asset),
                garment_path=Path(request.garment_asset),
                mask_path=Path(request.mask_asset) if request.mask_asset is not None else None,
                garment_category=request.garment_category,
                target_width=request.target_width,
                target_height=request.target_height,
                seed=request.seed,
            )
        )

        return ProviderResult(
            request_id=request.request_id,
            status="succeeded",
            provider_id=self.provider_id,
            provider_version=self.provider_version,
            result_assets=(f"echo://placeholder/{model_result.output_id}.json",),
            seed=model_result.seed,
            width=model_result.width,
            height=model_result.height,
            warnings=model_result.warnings,
        )
