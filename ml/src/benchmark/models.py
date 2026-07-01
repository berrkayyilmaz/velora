"""Typed benchmark result contract."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from typing import TypedDict

from src.providers.models import ProviderStatus


class BenchmarkResultPayload(TypedDict):
    """JSON-serializable benchmark result schema."""

    requestId: str
    provider: str
    providerVersion: str
    seed: int
    startedAt: str
    completedAt: str
    durationMs: float
    status: ProviderStatus
    outputPath: str | None
    error: str | None


@dataclass(frozen=True, slots=True)
class BenchmarkResult:
    """Result metadata for one provider benchmark execution."""

    request_id: str
    provider: str
    provider_version: str
    seed: int
    started_at: datetime
    completed_at: datetime
    duration_ms: float
    status: ProviderStatus
    output_path: str | None
    error: str | None

    def to_payload(self) -> BenchmarkResultPayload:
        """Return the camelCase JSON benchmark schema."""
        return {
            "requestId": self.request_id,
            "provider": self.provider,
            "providerVersion": self.provider_version,
            "seed": self.seed,
            "startedAt": self.started_at.isoformat(),
            "completedAt": self.completed_at.isoformat(),
            "durationMs": self.duration_ms,
            "status": self.status,
            "outputPath": self.output_path,
            "error": self.error,
        }
