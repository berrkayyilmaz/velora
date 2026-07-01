"""Benchmark result and deterministic dummy artifact writers."""

from __future__ import annotations

import hashlib
import json
import re
from dataclasses import asdict
from pathlib import Path

from src.benchmark.models import BenchmarkResult
from src.providers.models import ProviderResult


def _request_file_stem(request_id: str) -> str:
    safe_request_id = re.sub(r"[^a-zA-Z0-9_-]+", "-", request_id).strip("-_")
    safe_request_id = safe_request_id[:48] or "request"
    request_hash = hashlib.sha256(request_id.encode("utf-8")).hexdigest()[:8]
    return f"{safe_request_id}-{request_hash}"


def _write_json(path: Path, payload: object) -> Path:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        f"{json.dumps(payload, indent=2, sort_keys=True)}\n",
        encoding="utf-8",
    )
    return path


def write_dummy_artifact(output_dir: Path, result: ProviderResult) -> Path:
    """Write deterministic mock provider output without creating an image."""
    stem = _request_file_stem(result.request_id)
    return _write_json(output_dir / f"{stem}.dummy-output.json", asdict(result))


def write_benchmark_result(output_dir: Path, result: BenchmarkResult) -> Path:
    """Write one benchmark result JSON file."""
    stem = _request_file_stem(result.request_id)
    return _write_json(output_dir / f"{stem}.benchmark-result.json", result.to_payload())
