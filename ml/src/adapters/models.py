"""Model-neutral adapter request and result types."""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Literal

ModelStatus = Literal["succeeded", "failed"]


@dataclass(frozen=True, slots=True)
class ModelRequest:
    """Validated local file inputs for one model adapter execution."""

    request_id: str
    person_path: Path
    garment_path: Path
    mask_path: Path | None
    garment_category: str
    target_width: int
    target_height: int
    seed: int


@dataclass(frozen=True, slots=True)
class ModelResult:
    """Normalized model adapter output without provider transport details."""

    output_id: str
    width: int
    height: int
    seed: int
    warnings: tuple[str, ...] = ()
    status: ModelStatus = "succeeded"
    output_path: Path | None = None
    duration_ms: float = 0.0
    model_id: str = ""
    model_version: str = ""
    error: str | None = None
    metadata: tuple[tuple[str, str], ...] = ()
