"""Benchmark execution, result contracts, and output helpers."""

from src.benchmark.batch import create_run_id, run_benchmark_batch
from src.benchmark.execution import run_provider_benchmark
from src.benchmark.models import (
    BenchmarkResult,
    BenchmarkResultPayload,
    BenchmarkRunSummary,
    BenchmarkRunSummaryPayload,
)
from src.benchmark.output import (
    write_benchmark_result,
    write_benchmark_summary,
    write_dummy_artifact,
)
from src.benchmark.report import BenchmarkReportError, generate_benchmark_report

__all__ = [
    "BenchmarkReportError",
    "BenchmarkResult",
    "BenchmarkResultPayload",
    "BenchmarkRunSummary",
    "BenchmarkRunSummaryPayload",
    "create_run_id",
    "generate_benchmark_report",
    "run_benchmark_batch",
    "run_provider_benchmark",
    "write_benchmark_result",
    "write_benchmark_summary",
    "write_dummy_artifact",
]
