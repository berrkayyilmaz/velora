"""Benchmark result contracts and output helpers."""

from src.benchmark.models import BenchmarkResult, BenchmarkResultPayload
from src.benchmark.output import write_benchmark_result, write_dummy_artifact

__all__ = [
    "BenchmarkResult",
    "BenchmarkResultPayload",
    "write_benchmark_result",
    "write_dummy_artifact",
]
