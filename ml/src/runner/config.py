"""Typed JSON configuration loader for the local AI runner."""

from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path
from typing import cast


class RunnerConfigError(ValueError):
    """Raised when a runner configuration is missing or invalid."""


@dataclass(frozen=True, slots=True)
class ImageSize:
    """Configured output image dimensions."""

    width: int
    height: int


@dataclass(frozen=True, slots=True)
class RunnerConfig:
    """Validated local runner configuration."""

    provider: str
    device: str
    input_dir: Path
    output_dir: Path
    model_path: Path
    max_batch_size: int
    image_size: ImageSize
    seed: int

    def with_overrides(
        self,
        *,
        provider: str | None = None,
        device: str | None = None,
        input_dir: Path | None = None,
        output_dir: Path | None = None,
        model_path: Path | None = None,
        max_batch_size: int | None = None,
        width: int | None = None,
        height: int | None = None,
        seed: int | None = None,
    ) -> RunnerConfig:
        """Return a copy with explicit CLI values applied."""
        resolved_width = width if width is not None else self.image_size.width
        resolved_height = height if height is not None else self.image_size.height
        resolved_max_batch_size = (
            max_batch_size if max_batch_size is not None else self.max_batch_size
        )

        _validate_positive_int("maxBatchSize", resolved_max_batch_size)
        _validate_positive_int("imageSize.width", resolved_width)
        _validate_positive_int("imageSize.height", resolved_height)

        return RunnerConfig(
            provider=_validate_string(
                "provider",
                provider if provider is not None else self.provider,
            ),
            device=_validate_string(
                "device",
                device if device is not None else self.device,
            ),
            input_dir=input_dir if input_dir is not None else self.input_dir,
            output_dir=output_dir if output_dir is not None else self.output_dir,
            model_path=model_path if model_path is not None else self.model_path,
            max_batch_size=resolved_max_batch_size,
            image_size=ImageSize(width=resolved_width, height=resolved_height),
            seed=seed if seed is not None else self.seed,
        )


def _validate_string(field: str, value: object) -> str:
    if not isinstance(value, str) or not value.strip():
        raise RunnerConfigError(f"{field} must be a non-empty string")
    return value


def _validate_positive_int(field: str, value: object) -> int:
    if isinstance(value, bool) or not isinstance(value, int) or value < 1:
        raise RunnerConfigError(f"{field} must be a positive integer")
    return value


def _validate_int(field: str, value: object) -> int:
    if isinstance(value, bool) or not isinstance(value, int):
        raise RunnerConfigError(f"{field} must be an integer")
    return value


def _validate_object(field: str, value: object) -> dict[str, object]:
    if not isinstance(value, dict) or not all(isinstance(key, str) for key in value):
        raise RunnerConfigError(f"{field} must be an object")
    return cast(dict[str, object], value)


def _validate_fields(
    name: str,
    data: dict[str, object],
    expected_fields: set[str],
) -> None:
    missing_fields = sorted(expected_fields - data.keys())
    unknown_fields = sorted(data.keys() - expected_fields)
    if missing_fields:
        raise RunnerConfigError(f"{name} is missing fields: {', '.join(missing_fields)}")
    if unknown_fields:
        raise RunnerConfigError(f"{name} has unknown fields: {', '.join(unknown_fields)}")


def load_runner_config(path: Path) -> RunnerConfig:
    """Load and validate one runner JSON configuration."""
    try:
        raw_config: object = json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError as error:
        raise RunnerConfigError(f"Config file was not found: {path}") from error
    except (OSError, json.JSONDecodeError) as error:
        raise RunnerConfigError(f"Config file could not be read: {path}: {error}") from error

    config = _validate_object("config", raw_config)
    expected_fields = {
        "provider",
        "device",
        "inputDir",
        "outputDir",
        "modelPath",
        "maxBatchSize",
        "imageSize",
        "seed",
    }
    _validate_fields("config", config, expected_fields)

    image_size = _validate_object("imageSize", config["imageSize"])
    _validate_fields("imageSize", image_size, {"width", "height"})

    return RunnerConfig(
        provider=_validate_string("provider", config["provider"]),
        device=_validate_string("device", config["device"]),
        input_dir=Path(_validate_string("inputDir", config["inputDir"])),
        output_dir=Path(_validate_string("outputDir", config["outputDir"])),
        model_path=Path(_validate_string("modelPath", config["modelPath"])),
        max_batch_size=_validate_positive_int("maxBatchSize", config["maxBatchSize"]),
        image_size=ImageSize(
            width=_validate_positive_int("imageSize.width", image_size["width"]),
            height=_validate_positive_int("imageSize.height", image_size["height"]),
        ),
        seed=_validate_int("seed", config["seed"]),
    )
