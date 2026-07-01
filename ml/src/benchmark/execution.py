"""Shared provider benchmark execution."""

from __future__ import annotations

import time
from datetime import UTC, datetime
from pathlib import Path

from src.benchmark.models import BenchmarkResult
from src.benchmark.output import write_benchmark_result, write_provider_artifact
from src.providers import Provider, ProviderRequest


def run_provider_benchmark(
    provider: Provider,
    request: ProviderRequest,
    output_dir: Path,
) -> BenchmarkResult:
    """Execute one provider request and persist its normalized result."""
    started_at = datetime.now(UTC)
    started_clock = time.perf_counter()
    output_path: str | None = None
    error_message: str | None = None

    try:
        provider_result = provider.execute(request)
        output_path = str(write_provider_artifact(output_dir, provider_result))
        status = provider_result.status
    except Exception as error:  # noqa: BLE001 - failures must produce benchmark results.
        status = "failed"
        error_message = f"{type(error).__name__}: {error}"

    result = BenchmarkResult(
        request_id=request.request_id,
        provider=provider.provider_id,
        provider_version=provider.provider_version,
        seed=request.seed,
        started_at=started_at,
        completed_at=datetime.now(UTC),
        duration_ms=round((time.perf_counter() - started_clock) * 1000, 3),
        status=status,
        output_path=output_path,
        error=error_message,
    )
    write_benchmark_result(output_dir, result)
    return result
