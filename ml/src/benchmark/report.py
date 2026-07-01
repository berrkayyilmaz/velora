"""Markdown report generation for persisted benchmark batches."""

from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path
from typing import cast

from src.providers.models import ProviderStatus

_PROVIDER_STATUSES = {"succeeded", "failed", "rejected", "timed_out"}


class BenchmarkReportError(ValueError):
    """Raised when persisted benchmark data cannot produce a valid report."""


@dataclass(frozen=True, slots=True)
class _ReportSummary:
    run_id: str
    provider: str
    sample_count: int
    success_count: int
    failure_count: int
    average_duration_ms: float


@dataclass(frozen=True, slots=True)
class _ReportSample:
    request_id: str
    provider: str
    status: ProviderStatus
    output_path: str | None
    error: str | None


def _read_object(path: Path) -> dict[str, object]:
    try:
        value: object = json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError as error:
        raise BenchmarkReportError(f"Benchmark JSON was not found: {path}") from error
    except (OSError, json.JSONDecodeError) as error:
        raise BenchmarkReportError(f"Benchmark JSON could not be read: {path}: {error}") from error

    if not isinstance(value, dict) or not all(isinstance(key, str) for key in value):
        raise BenchmarkReportError(f"Benchmark JSON must contain an object: {path}")
    return cast(dict[str, object], value)


def _require_string(data: dict[str, object], field: str, path: Path) -> str:
    value = data.get(field)
    if not isinstance(value, str) or not value:
        raise BenchmarkReportError(f"{path}: {field} must be a non-empty string")
    return value


def _require_int(data: dict[str, object], field: str, path: Path) -> int:
    value = data.get(field)
    if isinstance(value, bool) or not isinstance(value, int) or value < 0:
        raise BenchmarkReportError(f"{path}: {field} must be a non-negative integer")
    return value


def _require_number(data: dict[str, object], field: str, path: Path) -> float:
    value = data.get(field)
    if isinstance(value, bool) or not isinstance(value, int | float) or value < 0:
        raise BenchmarkReportError(f"{path}: {field} must be a non-negative number")
    return float(value)


def _optional_string(data: dict[str, object], field: str, path: Path) -> str | None:
    value = data.get(field)
    if value is not None and not isinstance(value, str):
        raise BenchmarkReportError(f"{path}: {field} must be a string or null")
    return value


def _load_summary(path: Path) -> _ReportSummary:
    data = _read_object(path)
    return _ReportSummary(
        run_id=_require_string(data, "runId", path),
        provider=_require_string(data, "provider", path),
        sample_count=_require_int(data, "sampleCount", path),
        success_count=_require_int(data, "successCount", path),
        failure_count=_require_int(data, "failureCount", path),
        average_duration_ms=_require_number(data, "averageDurationMs", path),
    )


def _load_sample(path: Path) -> _ReportSample:
    data = _read_object(path)
    status_value = _require_string(data, "status", path)
    if status_value not in _PROVIDER_STATUSES:
        raise BenchmarkReportError(f"{path}: status is not supported: {status_value}")

    return _ReportSample(
        request_id=_require_string(data, "requestId", path),
        provider=_require_string(data, "provider", path),
        status=cast(ProviderStatus, status_value),
        output_path=_optional_string(data, "outputPath", path),
        error=_optional_string(data, "error", path),
    )


def _code(value: str) -> str:
    escaped_value = value.replace("`", "'")
    return f"`{escaped_value}`"


def _render_report(summary: _ReportSummary, samples: tuple[_ReportSample, ...]) -> str:
    failed_samples = tuple(sample for sample in samples if sample.status != "succeeded")
    artifacts = tuple(sample for sample in samples if sample.output_path is not None)
    lines = [
        "# AI Benchmark Report",
        "",
        "## Run Summary",
        "",
        "| Metric | Value |",
        "| --- | ---: |",
        f"| Run ID | {_code(summary.run_id)} |",
        f"| Provider | {_code(summary.provider)} |",
        f"| Samples | {summary.sample_count} |",
        f"| Successful | {summary.success_count} |",
        f"| Failed | {summary.failure_count} |",
        f"| Average duration | {summary.average_duration_ms:.3f} ms |",
        "",
        "## Failed Samples",
        "",
    ]

    if failed_samples:
        lines.extend(
            [
                "| Sample | Status | Error |",
                "| --- | --- | --- |",
                *[
                    (
                        f"| {_code(sample.request_id)} | {_code(sample.status)} | "
                        f"{sample.error or 'No error message'} |"
                    )
                    for sample in failed_samples
                ],
            ]
        )
    else:
        lines.append("None.")

    lines.extend(["", "## Output Artifacts", ""])
    if artifacts:
        lines.extend(
            f"- {_code(sample.request_id)}: {_code(cast(str, sample.output_path))}"
            for sample in artifacts
        )
    else:
        lines.append("None.")

    return "\n".join(lines) + "\n"


def generate_benchmark_report(summary_path: Path, output_path: Path) -> Path:
    """Read one persisted batch and write its Markdown report."""
    summary = _load_summary(summary_path)
    results_dir = summary_path.parent / "results"
    result_paths = tuple(sorted(results_dir.glob("*.benchmark-result.json")))
    samples = tuple(_load_sample(path) for path in result_paths)

    if len(samples) != summary.sample_count:
        raise BenchmarkReportError(
            f"Expected {summary.sample_count} sample results, found {len(samples)}"
        )
    if any(sample.provider != summary.provider for sample in samples):
        raise BenchmarkReportError("Sample provider does not match the batch summary")

    success_count = sum(sample.status == "succeeded" for sample in samples)
    counts_mismatch = (
        success_count != summary.success_count
        or len(samples) - success_count != summary.failure_count
    )
    if counts_mismatch:
        raise BenchmarkReportError("Sample result counts do not match the batch summary")

    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(_render_report(summary, samples), encoding="utf-8")
    return output_path
