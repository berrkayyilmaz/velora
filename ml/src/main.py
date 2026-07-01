"""Environment-only command-line entrypoint for the Velora AI workspace."""

from __future__ import annotations

import argparse
import json
import os
import platform
import sys
from collections.abc import Sequence
from dataclasses import asdict
from pathlib import Path

from src.providers import ProviderRequest, create_provider_registry


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
    dummy_parser.add_argument("--request-id", default="dummy-request")
    dummy_parser.add_argument("--person-asset", default="mock/person.png")
    dummy_parser.add_argument("--garment-asset", default="mock/garment.png")
    dummy_parser.add_argument("--garment-category", default="upper_body")
    dummy_parser.add_argument("--width", type=int, default=768)
    dummy_parser.add_argument("--height", type=int, default=1024)
    dummy_parser.add_argument("--seed", type=int, default=0)

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


def execute_dummy_provider(args: argparse.Namespace) -> None:
    """Execute the registered dummy provider and print its normalized result."""
    registry = create_provider_registry()
    provider = registry.get("dummy")
    request = ProviderRequest(
        request_id=args.request_id,
        person_asset=args.person_asset,
        garment_asset=args.garment_asset,
        garment_category=args.garment_category,
        target_width=args.width,
        target_height=args.height,
        seed=args.seed,
    )
    result = provider.execute(request)
    print(json.dumps(asdict(result), indent=2, sort_keys=True))


def main(argv: Sequence[str] | None = None) -> int:
    """Parse CLI arguments and execute the selected environment-only command."""
    parser = build_parser()
    args = parser.parse_args(argv)

    if args.command == "dummy":
        execute_dummy_provider(args)
        return 0

    for key, value in environment_info().items():
        print(f"{key}: {value}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
