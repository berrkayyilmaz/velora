from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from src.catvton_executor import CatVTONResearchExecutor, CommandResult
from src.config import CatVTONExecutorConfig, load_worker_config
from src.models import SubmitInferenceJobRequest


class MockCommandRunner:
    def __init__(self, result: CommandResult) -> None:
        self.result = result
        self.calls: list[dict[str, Any]] = []

    def run(
        self,
        args: list[str],
        *,
        cwd: Path,
        env: dict[str, str],
        timeout_seconds: float,
    ) -> CommandResult:
        self.calls.append(
            {
                "args": args,
                "cwd": cwd,
                "env": env,
                "timeout_seconds": timeout_seconds,
            }
        )
        return self.result


def create_config(tmp_path: Path) -> CatVTONExecutorConfig:
    ml_path = tmp_path / "ml"
    catvton_source_path = tmp_path / "catvton"
    person_root = tmp_path / "persons"
    catalog_root = tmp_path / "catalog"
    wardrobe_root = tmp_path / "wardrobe"
    for path in (ml_path, catvton_source_path, person_root, catalog_root, wardrobe_root):
        path.mkdir(parents=True)

    return CatVTONExecutorConfig(
        python_command="python",
        velora_ml_path=ml_path,
        catvton_source_path=catvton_source_path,
        person_image_root=person_root,
        catalog_garment_root=catalog_root,
        wardrobe_garment_root=wardrobe_root,
        person_image_path_template="{personImageAssetId}",
        catalog_garment_path_template="{productId}.png",
        wardrobe_garment_path_template="{wardrobeItemId}.png",
        base_model_path="base-model",
        resume_path="resume-path",
        device="cuda",
        cloth_type="upper",
        seed=42,
        inference_steps=30,
        guidance_scale=2.5,
        width=768,
        height=1024,
        timeout_seconds=600.0,
    )


def create_request(output_path: Path) -> SubmitInferenceJobRequest:
    return SubmitInferenceJobRequest(
        jobId="backend-job-1",
        personImageAssetId="person.png",
        garmentSource={
            "type": "catalog_product",
            "productId": "product-1",
        },
        outfitId=None,
        outputArtifactPath=str(output_path),
    )


def test_default_config_uses_fake_executor_mode() -> None:
    config = load_worker_config({})

    assert config.executor_mode == "fake"


def test_catvton_executor_success_maps_request_and_normalizes_result(tmp_path: Path) -> None:
    config = create_config(tmp_path)
    output_path = tmp_path / "outputs" / "result.png"
    output_path.parent.mkdir()
    output_path.write_text("fake image", encoding="utf-8")
    runner = MockCommandRunner(
        CommandResult(
            exit_code=0,
            stdout=json.dumps(
                {
                    "durationMs": 1234.5,
                    "height": 1024,
                    "metadata": {
                        "adapterId": "catvton-research",
                        "adapterVersion": "0.1.0",
                    },
                    "modelId": "catvton",
                    "modelVersion": "research-only",
                    "outputPath": str(output_path),
                    "status": "succeeded",
                    "width": 768,
                }
            ),
            stderr="",
            duration_ms=1300.0,
        )
    )
    executor = CatVTONResearchExecutor(config, runner=runner)

    result = executor.execute("worker-job-1", create_request(output_path))

    assert result.success is True
    assert result.duration_ms == 1234.5
    assert result.result is not None
    assert result.result.outputArtifactPath == str(output_path)
    assert result.result.modelId == "catvton"
    assert result.result.modelVersion == "research-only"
    assert result.result.durationMs == 1234.5
    assert result.result.metadata == {
        "adapterId": "catvton-research",
        "adapterVersion": "0.1.0",
    }
    assert runner.calls[0]["cwd"] == config.velora_ml_path
    assert str(config.catvton_source_path) in runner.calls[0]["env"]["PYTHONPATH"]
    assert runner.calls[0]["timeout_seconds"] == 600.0
    assert runner.calls[0]["args"] == [
        "python",
        "-m",
        "src.main",
        "catvton-research",
        "--person",
        str(config.person_image_root / "person.png"),
        "--garment",
        str(config.catalog_garment_root / "product-1.png"),
        "--cloth-type",
        "upper",
        "--output",
        str(output_path),
        "--seed",
        "42",
        "--inference-steps",
        "30",
        "--guidance-scale",
        "2.5",
        "--width",
        "768",
        "--height",
        "1024",
        "--device",
        "cuda",
        "--base-model-path",
        "base-model",
        "--resume-path",
        "resume-path",
    ]


def test_catvton_executor_normalizes_model_failure(tmp_path: Path) -> None:
    config = create_config(tmp_path)
    runner = MockCommandRunner(
        CommandResult(
            exit_code=0,
            stdout=json.dumps(
                {
                    "durationMs": 50.0,
                    "error": "ValueError: invalid input",
                    "height": 1024,
                    "modelId": "catvton",
                    "modelVersion": "research-only",
                    "outputPath": None,
                    "status": "failed",
                    "width": 768,
                }
            ),
            stderr="",
            duration_ms=55.0,
        )
    )
    executor = CatVTONResearchExecutor(config, runner=runner)

    result = executor.execute("worker-job-1", create_request(tmp_path / "out.png"))

    assert result.success is False
    assert result.duration_ms == 50.0
    assert result.error is not None
    assert result.error.code == "catvton_model_failed"
    assert result.error.message == "ValueError: invalid input"
    assert result.error.retryable is False


def test_catvton_executor_returns_configuration_error(tmp_path: Path) -> None:
    config = create_config(tmp_path)
    broken_config = CatVTONExecutorConfig(
        **{
            **config.__dict__,
            "velora_ml_path": None,
        }
    )
    runner = MockCommandRunner(CommandResult(exit_code=0, stdout="{}", stderr="", duration_ms=0.0))
    executor = CatVTONResearchExecutor(broken_config, runner=runner)

    result = executor.execute("worker-job-1", create_request(tmp_path / "out.png"))

    assert result.success is False
    assert result.error is not None
    assert result.error.code == "catvton_configuration_invalid"
    assert "VELORA_ML_PATH" in result.error.message
    assert runner.calls == []
