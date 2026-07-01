"""Common provider request and result models."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Literal

ProviderStatus = Literal["succeeded", "failed", "rejected", "timed_out"]


@dataclass(frozen=True, slots=True)
class ProviderRequest:
    """Model-neutral input for one provider execution."""

    request_id: str
    person_asset: str
    garment_asset: str
    garment_category: str
    target_width: int
    target_height: int
    seed: int


@dataclass(frozen=True, slots=True)
class ProviderResult:
    """Normalized output from one provider execution."""

    request_id: str
    status: ProviderStatus
    provider_id: str
    provider_version: str
    result_assets: tuple[str, ...]
    seed: int
    width: int
    height: int
    warnings: tuple[str, ...] = ()
