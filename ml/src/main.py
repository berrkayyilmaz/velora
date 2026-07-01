"""Environment-only command-line entrypoint for the Velora AI workspace."""

from __future__ import annotations

import argparse
import json
import os
import platform
import sys
import time
from collections.abc import Sequence
from datetime import UTC, datetime
from pathlib import Path

from src.benchmark import BenchmarkResult, write_benchmark_result, write_dummy_artifact
from src.providers import ProviderRequest, create_provider_registry
from src.runner import RunnerConfigError, load_runner_config


def build_parser() -> argparse.ArgumentParser:
    """Create the local AI workspace CLI parser."""
    parser = argparse.ArgumentParser(
        prog="python -m src.main",
        description="Inspect the local AI environment or execute a mock provider.",
    )
    subparsers = parser.add_subparsers(dest="command")

    dummy_parser = subparsers.add_parser(
        "dummy",
        help="Execute the deterministic dummy provider.",
    )
    dummy_parser.add_argument(
        "--config",
        type=Path,
        default=Path("config/example.runner.json"),
        help="Runner JSON configuration path.",
    )
    dummy_parser.add_argument("--request-id", default="dummy-request")
    dummy_parser.add_argument("--provider")
    dummy_parser.add_argument("--device")
    dummy_parser.add_argument("--input-dir", type=Path)
    dummy_parser.add_argument("--output-dir", type=Path)
    dummy_parser.add_argument("--model-path", type=Path)
    dummy_parser.add_argument("--max-batch-size", type=int)
    dummy_parser.add_argument("--person-asset")
    dummy_parser.add_argument("--garment-asset")
    dummy_parser.add_argument("--garment-category", default="upper_body")
    dummy_parser.add_argument("--width", type=int)
    dummy_parser.add_argument("--height", type=int)
    dummy_parser.add_argument("--seed", type=int)

    return parser


def environment_info() -> dict[str, str]:
    """Return non-sensitive local interpreter and platform details."""
    return {
        "cwd": str(Path.cwd()),
        "executable": sys.executable,
        "machine": platform.machine(),
        "platform": platform.platform(),
        "python": platform.python_version(),
        "virtual_environment": os.environ.get("VIRTUAL_ENV", "not active"),
    }


def execute_dummy_provider(args: argparse.Namespace) -> int:
    """Execute the dummy provider and write its benchmark output."""
    config = load_runner_config(args.config).with_overrides(
        provider=args.provider,
        device=args.device,
        input_dir=args.input_dir,
        output_dir=args.output_dir,
        model_path=args.model_path,
        max_batch_size=args.max_batch_size,
        width=args.width,
        height=args.height,
        seed=args.seed,
    )
    registry = create_provider_registry()
    provider = registry.get(config.provider)
    request = ProviderRequest(
        request_id=args.request_id,
        person_asset=args.person_asset or str(config.input_dir / "person.png"),
        garment_asset=args.garment_asset or str(config.input_dir / "garment.png"),
        garment_category=args.garment_category,
        target_width=config.image_size.width,
        target_height=config.image_size.height,
        seed=config.seed,
    )
    started_at = datetime.now(UTC)
    started_clock = time.perf_counter()
    output_path: str | None = None
    error_message: str | None = None

    try:
        provider_result = provider.execute(request)
        output_path = str(write_dummy_artifact(config.output_dir, provider_result))
        status = provider_result.status
    except Exception as error:  # noqa: BLE001 - benchmark failures must produce a result file.
        status = "failed"
        error_message = f"{type(error).__name__}: {error}"

    completed_at = datetime.now(UTC)
    benchmark_result = BenchmarkResult(
        request_id=request.request_id,
        provider=provider.provider_id,
        provider_version=provider.provider_version,
        seed=request.seed,
        started_at=started_at,
        completed_at=completed_at,
        duration_ms=round((time.perf_counter() - started_clock) * 1000, 3),
        status=status,
        output_path=output_path,
        error=error_message,
    )
    write_benchmark_result(config.output_dir, benchmark_result)
    print(json.dumps(benchmark_result.to_payload(), indent=2, sort_keys=True))
    return 1 if error_message else 0


def main(argv: Sequence[str] | None = None) -> int:
    """Parse CLI arguments and execute the selected environment-only command."""
    parser = build_parser()
    args = parser.parse_args(argv)

    if args.command == "dummy":
        try:
            return execute_dummy_provider(args)
        except (RunnerConfigError, ValueError) as error:
            parser.error(str(error))

    for key, value in environment_info().items():
        print(f"{key}: {value}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
