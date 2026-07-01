"""Environment-only command-line entrypoint for the Velora AI workspace."""

from __future__ import annotations

import argparse
import json
import os
import platform
import sys
from collections.abc import Sequence
from pathlib import Path

from src.benchmark import (
    BenchmarkReportError,
    create_run_id,
    generate_benchmark_report,
    run_benchmark_batch,
    run_provider_benchmark,
)
from src.datasets import DatasetManifestError, load_dataset_manifest
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

    manifest_parser = subparsers.add_parser(
        "validate-manifest",
        help="Validate a benchmark dataset manifest.",
    )
    manifest_parser.add_argument(
        "--manifest",
        type=Path,
        default=Path("config/example.dataset.json"),
        help="Benchmark dataset manifest JSON path.",
    )

    batch_parser = subparsers.add_parser(
        "dummy-batch",
        help="Run the dummy provider across a dataset manifest.",
    )
    batch_parser.add_argument(
        "--config",
        type=Path,
        default=Path("config/example.runner.json"),
        help="Runner JSON configuration path.",
    )
    batch_parser.add_argument(
        "--manifest",
        type=Path,
        default=Path("config/example.dataset.json"),
        help="Benchmark dataset manifest JSON path.",
    )
    batch_parser.add_argument("--run-id", help="Optional filesystem-safe run identifier.")

    echo_parser = subparsers.add_parser(
        "echo",
        help="Run the file-based echo provider across a dataset manifest.",
    )
    echo_parser.add_argument(
        "--config",
        type=Path,
        default=Path("config/example.runner.json"),
        help="Runner JSON configuration path.",
    )
    echo_parser.add_argument(
        "--manifest",
        type=Path,
        default=Path("config/example.dataset.json"),
        help="Benchmark dataset manifest JSON path.",
    )
    echo_parser.add_argument("--run-id", help="Optional filesystem-safe run identifier.")

    report_parser = subparsers.add_parser(
        "report",
        help="Generate a Markdown report from a persisted benchmark batch.",
    )
    report_parser.add_argument("--summary", type=Path, required=True)
    report_parser.add_argument("--output", type=Path, required=True)

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
    benchmark_result = run_provider_benchmark(provider, request, config.output_dir)
    print(json.dumps(benchmark_result.to_payload(), indent=2, sort_keys=True))
    return 0 if benchmark_result.status == "succeeded" else 1


def validate_manifest(args: argparse.Namespace) -> int:
    """Validate a dataset manifest and print a compact summary."""
    manifest = load_dataset_manifest(args.manifest)
    summary = {
        "datasetId": manifest.dataset_id,
        "sampleCount": len(manifest.samples),
        "schemaVersion": manifest.schema_version,
        "status": "valid",
    }
    print(json.dumps(summary, indent=2, sort_keys=True))
    return 0


def execute_dummy_batch(args: argparse.Namespace) -> int:
    """Run the configured dummy provider across one dataset manifest."""
    config = load_runner_config(args.config)
    manifest = load_dataset_manifest(args.manifest)
    provider = create_provider_registry().get(config.provider)
    run_id = args.run_id or create_run_id(provider.provider_id)
    summary = run_benchmark_batch(
        provider=provider,
        manifest=manifest,
        config=config,
        run_id=run_id,
    )
    print(json.dumps(summary.to_payload(), indent=2, sort_keys=True))
    return 0 if summary.failure_count == 0 else 1


def execute_echo_batch(args: argparse.Namespace) -> int:
    """Run the echo provider across one validated dataset manifest."""
    config = load_runner_config(args.config).with_overrides(provider="echo")
    manifest = load_dataset_manifest(args.manifest)
    provider = create_provider_registry().get(config.provider)
    run_id = args.run_id or create_run_id(provider.provider_id)
    summary = run_benchmark_batch(
        provider=provider,
        manifest=manifest,
        config=config,
        run_id=run_id,
    )
    print(json.dumps(summary.to_payload(), indent=2, sort_keys=True))
    return 0 if summary.failure_count == 0 else 1


def generate_report(args: argparse.Namespace) -> int:
    """Generate a Markdown report from persisted benchmark JSON."""
    output_path = generate_benchmark_report(args.summary, args.output)
    print(output_path)
    return 0


def main(argv: Sequence[str] | None = None) -> int:
    """Parse CLI arguments and execute the selected environment-only command."""
    parser = build_parser()
    args = parser.parse_args(argv)

    if args.command == "dummy":
        try:
            return execute_dummy_provider(args)
        except (RunnerConfigError, ValueError) as error:
            parser.error(str(error))

    if args.command == "validate-manifest":
        try:
            return validate_manifest(args)
        except DatasetManifestError as error:
            parser.error(str(error))

    if args.command == "dummy-batch":
        try:
            return execute_dummy_batch(args)
        except (DatasetManifestError, RunnerConfigError, ValueError) as error:
            parser.error(str(error))

    if args.command == "echo":
        try:
            return execute_echo_batch(args)
        except (DatasetManifestError, RunnerConfigError, ValueError) as error:
            parser.error(str(error))

    if args.command == "report":
        try:
            return generate_report(args)
        except BenchmarkReportError as error:
            parser.error(str(error))

    for key, value in environment_info().items():
        print(f"{key}: {value}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
