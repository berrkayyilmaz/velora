"""Environment configuration for the AI worker."""

from __future__ import annotations

import os
from collections.abc import Mapping
from dataclasses import dataclass
from pathlib import Path
from typing import Literal, cast

ExecutorMode = Literal["fake", "catvton-research"]


@dataclass(frozen=True)
class CatVTONExecutorConfig:
    """Configuration required for opt-in CatVTON research execution."""

    python_command: str
    velora_ml_path: Path | None
    catvton_source_path: Path | None
    person_image_root: Path | None
    catalog_garment_root: Path | None
    wardrobe_garment_root: Path | None
    person_image_path_template: str
    catalog_garment_path_template: str
    wardrobe_garment_path_template: str
    base_model_path: str
    resume_path: str
    device: str
    cloth_type: str
    seed: int
    inference_steps: int
    guidance_scale: float
    width: int
    height: int
    timeout_seconds: float


@dataclass(frozen=True)
class WorkerConfig:
    """Top-level worker configuration."""

    executor_mode: ExecutorMode
    catvton: CatVTONExecutorConfig


def _optional_path(value: str | None) -> Path | None:
    if value is None or value.strip() == "":
        return None
    return Path(value.strip())


def _int_value(env: Mapping[str, str], key: str, default: int) -> int:
    value = env.get(key)
    if value is None or value.strip() == "":
        return default
    return int(value)


def _float_value(env: Mapping[str, str], key: str, default: float) -> float:
    value = env.get(key)
    if value is None or value.strip() == "":
        return default
    return float(value)


def load_worker_config(env: Mapping[str, str] | None = None) -> WorkerConfig:
    """Load worker configuration from environment variables."""

    values = os.environ if env is None else env
    executor_mode_value = values.get("VELORA_AI_WORKER_EXECUTOR_MODE", "fake").strip()

    if executor_mode_value not in {"fake", "catvton-research"}:
        raise ValueError("VELORA_AI_WORKER_EXECUTOR_MODE must be fake or catvton-research.")
    executor_mode = cast(ExecutorMode, executor_mode_value)

    return WorkerConfig(
        executor_mode=executor_mode,
        catvton=CatVTONExecutorConfig(
            python_command=values.get("CATVTON_PYTHON_COMMAND", "python").strip() or "python",
            velora_ml_path=_optional_path(values.get("VELORA_ML_PATH")),
            catvton_source_path=_optional_path(values.get("CATVTON_SOURCE_PATH")),
            person_image_root=_optional_path(values.get("CATVTON_PERSON_IMAGE_ROOT")),
            catalog_garment_root=_optional_path(values.get("CATVTON_CATALOG_GARMENT_ROOT")),
            wardrobe_garment_root=_optional_path(values.get("CATVTON_WARDROBE_GARMENT_ROOT")),
            person_image_path_template=values.get(
                "CATVTON_PERSON_IMAGE_PATH_TEMPLATE", "{personImageAssetId}"
            ).strip(),
            catalog_garment_path_template=values.get(
                "CATVTON_CATALOG_GARMENT_PATH_TEMPLATE", "{productId}.png"
            ).strip(),
            wardrobe_garment_path_template=values.get(
                "CATVTON_WARDROBE_GARMENT_PATH_TEMPLATE", "{wardrobeItemId}.png"
            ).strip(),
            base_model_path=values.get(
                "CATVTON_BASE_MODEL_PATH", "runwayml/stable-diffusion-inpainting"
            ).strip(),
            resume_path=values.get("CATVTON_RESUME_PATH", "zhengchong/CatVTON").strip(),
            device=values.get("CATVTON_DEVICE", "cuda").strip(),
            cloth_type=values.get("CATVTON_CLOTH_TYPE", "upper").strip(),
            seed=_int_value(values, "CATVTON_SEED", 42),
            inference_steps=_int_value(values, "CATVTON_INFERENCE_STEPS", 30),
            guidance_scale=_float_value(values, "CATVTON_GUIDANCE_SCALE", 2.5),
            width=_int_value(values, "CATVTON_WIDTH", 768),
            height=_int_value(values, "CATVTON_HEIGHT", 1024),
            timeout_seconds=_float_value(values, "CATVTON_TIMEOUT_SECONDS", 600.0),
        ),
    )
