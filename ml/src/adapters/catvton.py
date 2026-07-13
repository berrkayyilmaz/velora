"""Research-only CatVTON model adapter."""

from __future__ import annotations

import importlib
import re
import time
from collections.abc import Callable
from pathlib import Path
from typing import TYPE_CHECKING, Protocol, cast

from src.adapters.base import ModelAdapter
from src.adapters.models import ModelRequest, ModelResult

if TYPE_CHECKING:
    from src.providers.catvton_research import (
        CatVTONResearchConfig,
        CatVTONResearchResult,
        ClothType,
        MixedPrecision,
    )

CATVTON_RESEARCH_WARNING = (
    "research_only_catvton_noncommercial_license_not_approved_for_product_use"
)

_REQUEST_ID_PATTERN = re.compile(r"[^A-Za-z0-9_.-]+")


class _ResearchModule(Protocol):
    CatVTONResearchConfig: _ResearchConfigFactory
    run_direct_inference: _ResearchRunner
    validate_config: _ResearchConfigValidator


class _ResearchConfigFactory(Protocol):
    def __call__(
        self,
        *,
        person_image_path: Path,
        garment_image_path: Path,
        cloth_type: ClothType,
        output_path: Path,
        seed: int,
        inference_steps: int,
        guidance_scale: float,
        base_model_path: str,
        resume_path: str,
        width: int,
        height: int,
        mixed_precision: MixedPrecision,
        device: str,
        allow_tf32: bool,
        skip_safety_check: bool,
    ) -> CatVTONResearchConfig:
        """Create a research config."""


class _ResearchRunner(Protocol):
    def __call__(self, config: CatVTONResearchConfig) -> CatVTONResearchResult:
        """Run research inference."""


class _ResearchConfigValidator(Protocol):
    def __call__(self, config: CatVTONResearchConfig) -> CatVTONResearchConfig:
        """Validate a research config."""


def _load_research_module() -> _ResearchModule:
    return cast(
        _ResearchModule,
        importlib.import_module("src.providers.catvton_research"),
    )


def _safe_output_stem(request_id: str) -> str:
    stem = _REQUEST_ID_PATTERN.sub("-", request_id).strip(".-")
    return stem or "catvton-request"


def _map_cloth_type(garment_category: str) -> ClothType:
    normalized = garment_category.strip().lower().replace("-", "_").replace(" ", "_")
    if normalized in {"upper", "upper_body", "top", "tops", "shirt", "blouse", "outerwear"}:
        return "upper"
    if normalized in {"lower", "lower_body", "bottom", "bottoms", "pants", "skirt", "shorts"}:
        return "lower"
    if normalized in {"overall", "dress", "dresses", "full_body", "full"}:
        return "overall"
    raise ValueError("garment_category must map to CatVTON cloth type upper, lower, or overall.")


class CatVTONAdapter(ModelAdapter):
    """Execute one research-only CatVTON request through the direct runner."""

    adapter_id = "catvton-research"
    adapter_version = "0.1.0"
    model_id = "catvton"
    model_version = "research-only"

    def __init__(
        self,
        *,
        output_dir: Path = Path("data/output/catvton-research"),
        runner: Callable[[CatVTONResearchConfig], CatVTONResearchResult] | None = None,
        base_model_path: str = "runwayml/stable-diffusion-inpainting",
        resume_path: str = "zhengchong/CatVTON",
        inference_steps: int = 30,
        guidance_scale: float = 2.5,
        mixed_precision: MixedPrecision = "fp16",
        device: str = "cuda",
        allow_tf32: bool = True,
        skip_safety_check: bool = False,
    ) -> None:
        self._output_dir = output_dir
        self._runner = runner
        self._base_model_path = base_model_path
        self._resume_path = resume_path
        self._inference_steps = inference_steps
        self._guidance_scale = guidance_scale
        self._mixed_precision = mixed_precision
        self._device = device
        self._allow_tf32 = allow_tf32
        self._skip_safety_check = skip_safety_check

    def with_options(
        self,
        *,
        base_model_path: str | None = None,
        resume_path: str | None = None,
        inference_steps: int | None = None,
        guidance_scale: float | None = None,
        device: str | None = None,
    ) -> CatVTONAdapter:
        """Return a copy configured for one research smoke command."""
        return CatVTONAdapter(
            output_dir=self._output_dir,
            runner=self._runner,
            base_model_path=base_model_path or self._base_model_path,
            resume_path=resume_path or self._resume_path,
            inference_steps=(
                inference_steps if inference_steps is not None else self._inference_steps
            ),
            guidance_scale=(guidance_scale if guidance_scale is not None else self._guidance_scale),
            mixed_precision=self._mixed_precision,
            device=device or self._device,
            allow_tf32=self._allow_tf32,
            skip_safety_check=self._skip_safety_check,
        )

    def execute(self, request: ModelRequest) -> ModelResult:
        """Execute CatVTON research inference and normalize success or failure."""
        started_clock = time.perf_counter()
        output_path = request.output_path or self._output_dir / (
            f"{_safe_output_stem(request.request_id)}.png"
        )

        try:
            research_module = _load_research_module()
            config = research_module.CatVTONResearchConfig(
                person_image_path=request.person_path,
                garment_image_path=request.garment_path,
                cloth_type=_map_cloth_type(request.garment_category),
                output_path=output_path,
                seed=request.seed,
                inference_steps=self._inference_steps,
                guidance_scale=self._guidance_scale,
                base_model_path=self._base_model_path,
                resume_path=self._resume_path,
                width=request.target_width,
                height=request.target_height,
                mixed_precision=self._mixed_precision,
                device=self._device,
                allow_tf32=self._allow_tf32,
                skip_safety_check=self._skip_safety_check,
            )
            research_module.validate_config(config)
            result = (self._runner or research_module.run_direct_inference)(config)
            duration_ms = round((time.perf_counter() - started_clock) * 1000, 3)
            return ModelResult(
                output_id=result.output_path.stem,
                width=result.width,
                height=result.height,
                seed=result.seed,
                warnings=(CATVTON_RESEARCH_WARNING,),
                status="succeeded",
                output_path=result.output_path,
                duration_ms=duration_ms,
                model_id=self.model_id,
                model_version=self.model_version,
                metadata=(
                    ("adapterId", self.adapter_id),
                    ("adapterVersion", self.adapter_version),
                    ("maskGenerated", str(result.mask_generated).lower()),
                    ("inferenceSteps", str(result.inference_steps)),
                    ("guidanceScale", str(result.guidance_scale)),
                    ("device", result.device),
                ),
            )
        except Exception as error:  # noqa: BLE001 - adapters normalize model failures.
            duration_ms = round((time.perf_counter() - started_clock) * 1000, 3)
            return ModelResult(
                output_id=output_path.stem,
                width=request.target_width,
                height=request.target_height,
                seed=request.seed,
                warnings=(CATVTON_RESEARCH_WARNING,),
                status="failed",
                output_path=None,
                duration_ms=duration_ms,
                model_id=self.model_id,
                model_version=self.model_version,
                error=f"{type(error).__name__}: {error}",
                metadata=(
                    ("adapterId", self.adapter_id),
                    ("adapterVersion", self.adapter_version),
                ),
            )
