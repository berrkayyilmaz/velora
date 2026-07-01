"""Sequential benchmark dataset runner."""

from __future__ import annotations

import re
import uuid
from datetime import UTC, datetime

from src.benchmark.execution import run_provider_benchmark
from src.benchmark.models import BenchmarkRunSummary
from src.benchmark.output import write_benchmark_summary
from src.datasets import BenchmarkDatasetManifest
from src.providers import Provider, ProviderRequest
from src.runner import RunnerConfig

_RUN_ID_PATTERN = re.compile(r"^[a-zA-Z0-9][a-zA-Z0-9_-]*$")


def create_run_id(provider_id: str) -> str:
    """Create a filesystem-safe batch run identifier."""
    timestamp = datetime.now(UTC).strftime("%Y%m%dT%H%M%SZ")
    provider_slug = re.sub(r"[^a-zA-Z0-9_-]+", "-", provider_id).strip("-_") or "provider"
    return f"run-{timestamp}-{provider_slug}-{uuid.uuid4().hex[:8]}"


def _validate_run_id(run_id: str) -> None:
    if not _RUN_ID_PATTERN.fullmatch(run_id):
        raise ValueError("runId must contain only letters, numbers, hyphens, or underscores")


def run_benchmark_batch(
    *,
    provider: Provider,
    manifest: BenchmarkDatasetManifest,
    config: RunnerConfig,
    run_id: str,
) -> BenchmarkRunSummary:
    """Run one provider sequentially across a validated dataset manifest."""
    _validate_run_id(run_id)
    started_at = datetime.now(UTC)
    results_dir = config.output_dir / run_id / "results"
    results = []

    for sample in manifest.samples:
        request = ProviderRequest(
            request_id=sample.sample_id,
            person_asset=str(sample.person_image_path),
            garment_asset=str(sample.garment_image_path),
            garment_category=sample.expected_category,
            target_width=config.image_size.width,
            target_height=config.image_size.height,
            seed=config.seed,
        )
        results.append(run_provider_benchmark(provider, request, results_dir))

    completed_at = datetime.now(UTC)
    success_count = sum(result.status == "succeeded" for result in results)
    average_duration_ms = round(
        sum(result.duration_ms for result in results) / len(results),
        3,
    )
    summary = BenchmarkRunSummary(
        run_id=run_id,
        provider=provider.provider_id,
        sample_count=len(results),
        success_count=success_count,
        failure_count=len(results) - success_count,
        average_duration_ms=average_duration_ms,
        started_at=started_at,
        completed_at=completed_at,
    )
    write_benchmark_summary(config.output_dir / run_id, summary)
    return summary
