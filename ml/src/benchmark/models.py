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


class BenchmarkRunSummaryPayload(TypedDict):
    """JSON-serializable batch benchmark summary schema."""

    runId: str
    provider: str
    sampleCount: int
    successCount: int
    failureCount: int
    averageDurationMs: float
    startedAt: str
    completedAt: str


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


@dataclass(frozen=True, slots=True)
class BenchmarkRunSummary:
    """Aggregate metadata for one batch benchmark run."""

    run_id: str
    provider: str
    sample_count: int
    success_count: int
    failure_count: int
    average_duration_ms: float
    started_at: datetime
    completed_at: datetime

    def to_payload(self) -> BenchmarkRunSummaryPayload:
        """Return the camelCase JSON summary schema."""
        return {
            "runId": self.run_id,
            "provider": self.provider,
            "sampleCount": self.sample_count,
            "successCount": self.success_count,
            "failureCount": self.failure_count,
            "averageDurationMs": self.average_duration_ms,
            "startedAt": self.started_at.isoformat(),
            "completedAt": self.completed_at.isoformat(),
        }
