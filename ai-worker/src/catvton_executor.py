"""Opt-in CatVTON research executor backed by the Velora ML CLI."""

from __future__ import annotations

import json
import os
import subprocess
import time
from collections.abc import Mapping, Sequence
from dataclasses import dataclass
from pathlib import Path
from string import Formatter
from typing import Any, Protocol

from src.config import CatVTONExecutorConfig
from src.executor import InferenceResult
from src.models import ResultMetadataResponse, SubmitInferenceJobRequest, WorkerError


@dataclass(frozen=True)
class CommandResult:
    """Captured process result from the Velora ML CLI."""

    exit_code: int
    stdout: str
    stderr: str
    duration_ms: float


class CommandRunner(Protocol):
    """Run one command without shell interpolation."""

    def run(
        self,
        args: Sequence[str],
        *,
        cwd: Path,
        env: Mapping[str, str],
        timeout_seconds: float,
    ) -> CommandResult:
        """Execute args and return captured output."""


class SubprocessCommandRunner:
    """Default command runner used only when CatVTON mode is explicitly enabled."""

    def run(
        self,
        args: Sequence[str],
        *,
        cwd: Path,
        env: Mapping[str, str],
        timeout_seconds: float,
    ) -> CommandResult:
        started_at = time.perf_counter()
        try:
            completed = subprocess.run(
                list(args),
                cwd=cwd,
                env=dict(env),
                capture_output=True,
                text=True,
                timeout=timeout_seconds,
                check=False,
            )
            return CommandResult(
                exit_code=completed.returncode,
                stdout=completed.stdout,
                stderr=completed.stderr,
                duration_ms=round((time.perf_counter() - started_at) * 1000, 3),
            )
        except subprocess.TimeoutExpired as error:
            return CommandResult(
                exit_code=-1,
                stdout=error.stdout if isinstance(error.stdout, str) else "",
                stderr="CatVTON research execution timed out.",
                duration_ms=round((time.perf_counter() - started_at) * 1000, 3),
            )


class CatVTONConfigurationError(ValueError):
    """Raised when CatVTON research mode is not fully configured."""


class CatVTONResearchExecutor:
    """Execute CatVTON through the existing Velora ML adapter CLI."""

    def __init__(
        self,
        config: CatVTONExecutorConfig,
        *,
        runner: CommandRunner | None = None,
    ) -> None:
        self._config = config
        self._runner = runner or SubprocessCommandRunner()

    def execute(self, worker_job_id: str, request: SubmitInferenceJobRequest) -> InferenceResult:
        try:
            command = self._build_command(request)
        except CatVTONConfigurationError as error:
            return InferenceResult(
                success=False,
                error=WorkerError(
                    code="catvton_configuration_invalid",
                    message=str(error),
                    retryable=False,
                ),
            )

        result = self._runner.run(
            command.args,
            cwd=command.cwd,
            env=command.env,
            timeout_seconds=self._config.timeout_seconds,
        )

        if result.exit_code != 0:
            return InferenceResult(
                success=False,
                duration_ms=result.duration_ms,
                error=WorkerError(
                    code="catvton_research_failed",
                    message=_failure_message(result),
                    retryable=False,
                ),
            )

        payload = _parse_model_result(result.stdout)
        if payload is None:
            return InferenceResult(
                success=False,
                duration_ms=result.duration_ms,
                error=WorkerError(
                    code="catvton_response_malformed",
                    message="CatVTON research adapter returned malformed JSON.",
                    retryable=False,
                ),
            )

        if payload.get("status") != "succeeded":
            return InferenceResult(
                success=False,
                duration_ms=_payload_duration(payload, result.duration_ms),
                error=WorkerError(
                    code="catvton_model_failed",
                    message=str(payload.get("error") or "CatVTON research adapter failed."),
                    retryable=False,
                ),
            )

        output_path = _payload_output_path(payload)
        if output_path is None:
            return InferenceResult(
                success=False,
                duration_ms=_payload_duration(payload, result.duration_ms),
                error=WorkerError(
                    code="catvton_output_missing",
                    message="CatVTON research adapter succeeded without an output path.",
                    retryable=False,
                ),
            )

        duration_ms = _payload_duration(payload, result.duration_ms)
        return InferenceResult(
            success=True,
            duration_ms=duration_ms,
            result=ResultMetadataResponse(
                workerJobId=worker_job_id,
                status="succeeded",
                outputArtifactPath=str(output_path),
                mediaType="image/png",
                width=_int_payload(payload, "width", self._config.width),
                height=_int_payload(payload, "height", self._config.height),
                fileSize=output_path.stat().st_size if output_path.exists() else 0,
                modelId=_str_payload(payload, "modelId") or "catvton",
                modelVersion=_str_payload(payload, "modelVersion") or "research-only",
                durationMs=duration_ms,
                metadata=_metadata_payload(payload),
            ),
        )

    def _build_command(self, request: SubmitInferenceJobRequest) -> _CatVTONCommand:
        config = self._config
        ml_path = _required_directory(config.velora_ml_path, "VELORA_ML_PATH")
        catvton_source_path = _required_directory(config.catvton_source_path, "CATVTON_SOURCE_PATH")
        person_path = _resolve_path(
            root=config.person_image_root,
            template=config.person_image_path_template,
            values=_template_values(request),
            env_name="CATVTON_PERSON_IMAGE_ROOT",
        )
        garment_path = self._resolve_garment_path(request)
        output_path = Path(request.outputArtifactPath)

        args = [
            config.python_command,
            "-m",
            "src.main",
            "catvton-research",
            "--person",
            str(person_path),
            "--garment",
            str(garment_path),
            "--cloth-type",
            config.cloth_type,
            "--output",
            str(output_path),
            "--seed",
            str(config.seed),
            "--inference-steps",
            str(config.inference_steps),
            "--guidance-scale",
            str(config.guidance_scale),
            "--width",
            str(config.width),
            "--height",
            str(config.height),
            "--device",
            config.device,
            "--base-model-path",
            config.base_model_path,
            "--resume-path",
            config.resume_path,
        ]
        env = dict(os.environ)
        existing_python_path = env.get("PYTHONPATH")
        env["PYTHONPATH"] = (
            str(catvton_source_path)
            if existing_python_path is None or existing_python_path == ""
            else f"{catvton_source_path}{os.pathsep}{existing_python_path}"
        )

        return _CatVTONCommand(args=args, cwd=ml_path, env=env)

    def _resolve_garment_path(self, request: SubmitInferenceJobRequest) -> Path:
        if request.garmentSource.type == "catalog_product":
            return _resolve_path(
                root=self._config.catalog_garment_root,
                template=self._config.catalog_garment_path_template,
                values=_template_values(request),
                env_name="CATVTON_CATALOG_GARMENT_ROOT",
            )

        return _resolve_path(
            root=self._config.wardrobe_garment_root,
            template=self._config.wardrobe_garment_path_template,
            values=_template_values(request),
            env_name="CATVTON_WARDROBE_GARMENT_ROOT",
        )


@dataclass(frozen=True)
class _CatVTONCommand:
    args: list[str]
    cwd: Path
    env: Mapping[str, str]


def _required_directory(path: Path | None, env_name: str) -> Path:
    if path is None:
        raise CatVTONConfigurationError(f"{env_name} is required for CatVTON research mode.")
    if not path.exists() or not path.is_dir():
        raise CatVTONConfigurationError(f"{env_name} must point to an existing directory: {path}")
    return path


def _template_values(request: SubmitInferenceJobRequest) -> dict[str, str]:
    values = {
        "jobId": request.jobId,
        "personImageAssetId": request.personImageAssetId,
        "outfitId": request.outfitId or "",
        "productId": "",
        "wardrobeItemId": "",
    }
    if request.garmentSource.type == "catalog_product":
        values["productId"] = request.garmentSource.productId
    else:
        values["wardrobeItemId"] = request.garmentSource.wardrobeItemId
    return values


def _render_template(template: str, values: Mapping[str, str]) -> str:
    names = [field_name for _, field_name, _, _ in Formatter().parse(template) if field_name]
    missing = [name for name in names if name not in values]
    if missing:
        raise CatVTONConfigurationError(f"Path template includes unsupported fields: {missing}")
    return template.format(**values)


def _resolve_path(
    *,
    root: Path | None,
    template: str,
    values: Mapping[str, str],
    env_name: str,
) -> Path:
    rendered = Path(_render_template(template, values))
    if rendered.is_absolute():
        return rendered
    if root is None:
        raise CatVTONConfigurationError(f"{env_name} is required for relative CatVTON paths.")
    return root / rendered


def _failure_message(result: CommandResult) -> str:
    message = result.stderr.strip() or result.stdout.strip()
    return message or "CatVTON research execution failed."


def _parse_model_result(stdout: str) -> dict[str, Any] | None:
    try:
        payload = json.loads(stdout)
    except json.JSONDecodeError:
        start = stdout.find("{")
        end = stdout.rfind("}")
        if start == -1 or end == -1 or end < start:
            return None
        try:
            payload = json.loads(stdout[start : end + 1])
        except json.JSONDecodeError:
            return None

    return payload if isinstance(payload, dict) else None


def _payload_output_path(payload: Mapping[str, Any]) -> Path | None:
    output_path = payload.get("outputPath")
    if not isinstance(output_path, str) or output_path.strip() == "":
        return None
    return Path(output_path)


def _payload_duration(payload: Mapping[str, Any], fallback: float) -> float:
    duration = payload.get("durationMs")
    if isinstance(duration, int | float):
        return float(duration)
    return fallback


def _int_payload(payload: Mapping[str, Any], key: str, fallback: int) -> int:
    value = payload.get(key)
    return value if isinstance(value, int) else fallback


def _str_payload(payload: Mapping[str, Any], key: str) -> str | None:
    value = payload.get(key)
    return value if isinstance(value, str) and value.strip() else None


def _metadata_payload(payload: Mapping[str, Any]) -> dict[str, str] | None:
    metadata = payload.get("metadata")
    if not isinstance(metadata, dict):
        return None

    normalized = {str(key): str(value) for key, value in metadata.items()}
    return normalized or None
