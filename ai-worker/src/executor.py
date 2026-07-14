"""Deterministic fake inference executor for worker foundation tests."""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

from src.models import ResultMetadataResponse, SubmitInferenceJobRequest, WorkerError


@dataclass(frozen=True)
class FakeInferenceResult:
    """Normalized fake executor result."""

    success: bool
    result: ResultMetadataResponse | None = None
    error: WorkerError | None = None


class FakeInferenceExecutor:
    """Fake executor that writes deterministic placeholder output artifacts."""

    model_id = "fake-remote-vton"
    model_version = "fake-remote-0.1"
    media_type = "image/png"
    width = 768
    height = 1024

    def execute(
        self, worker_job_id: str, request: SubmitInferenceJobRequest
    ) -> FakeInferenceResult:
        if self._should_fail(request):
            return FakeInferenceResult(
                success=False,
                error=WorkerError(
                    code="fake_inference_failed",
                    message="Fake deterministic inference failure.",
                    retryable=False,
                ),
            )

        output_path = Path(request.outputArtifactPath)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        output_body = (
            "velora fake remote try-on output\n"
            f"workerJobId={worker_job_id}\n"
            f"sourceType={request.garmentSource.type}\n"
            f"personImageAssetId={request.personImageAssetId}\n"
        )
        output_path.write_text(output_body, encoding="utf-8")

        return FakeInferenceResult(
            success=True,
            result=ResultMetadataResponse(
                workerJobId=worker_job_id,
                status="succeeded",
                outputArtifactPath=str(output_path),
                mediaType=self.media_type,
                width=self.width,
                height=self.height,
                fileSize=output_path.stat().st_size,
                modelId=self.model_id,
                modelVersion=self.model_version,
            ),
        )

    @staticmethod
    def _should_fail(request: SubmitInferenceJobRequest) -> bool:
        failure_markers = (
            request.personImageAssetId,
            request.outputArtifactPath,
        )

        return any("force-fail" in marker for marker in failure_markers)
