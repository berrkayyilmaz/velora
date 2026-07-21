"""Thread-safe in-memory storage for remote worker jobs."""

from __future__ import annotations

import time
from dataclasses import dataclass, field
from datetime import UTC, datetime
from threading import Lock
from uuid import uuid4

from src.executor import FakeInferenceExecutor, InferenceExecutor, InferenceResult
from src.models import (
    ResultMetadataResponse,
    SubmitInferenceJobRequest,
    WorkerError,
    WorkerJobStatus,
    WorkerJobStatusResponse,
)


@dataclass
class WorkerJob:
    """In-memory worker job record."""

    worker_job_id: str
    request: SubmitInferenceJobRequest
    status: WorkerJobStatus = "queued"
    error: WorkerError | None = None
    result: ResultMetadataResponse | None = None
    duration_ms: float | None = None
    created_at: datetime = field(default_factory=lambda: datetime.now(UTC))
    updated_at: datetime = field(default_factory=lambda: datetime.now(UTC))


class InMemoryJobStore:
    """Small replaceable job store used only by the worker foundation."""

    def __init__(self, executor: InferenceExecutor | None = None) -> None:
        self._executor = executor or FakeInferenceExecutor()
        self._jobs: dict[str, WorkerJob] = {}
        self._lock = Lock()

    def submit(self, request: SubmitInferenceJobRequest) -> WorkerJob:
        with self._lock:
            worker_job_id = f"worker-{uuid4()}"
            job = WorkerJob(worker_job_id=worker_job_id, request=request)
            self._jobs[worker_job_id] = job
            return job

    def get(self, worker_job_id: str) -> WorkerJob | None:
        with self._lock:
            return self._jobs.get(worker_job_id)

    def cancel(self, worker_job_id: str) -> WorkerJob | None:
        with self._lock:
            job = self._jobs.get(worker_job_id)

            if job is None:
                return None

            if job.status in {"queued", "processing"}:
                job.status = "cancelled"
                job.updated_at = datetime.now(UTC)

            return job

    def execute_job(self, worker_job_id: str) -> None:
        """Execute one queued job outside the HTTP request lifecycle."""
        request = self._start_processing(worker_job_id)

        if request is None:
            return

        try:
            result = self._executor.execute(worker_job_id, request)
        except Exception as error:  # noqa: BLE001 - worker failures must be normalized.
            result = InferenceResult(
                success=False,
                duration_ms=0.0,
                error=WorkerError(
                    code="worker_executor_exception",
                    message=str(error) or "Inference executor failed unexpectedly.",
                    retryable=False,
                ),
            )

        self._persist_execution_result(worker_job_id, result)

    def _start_processing(self, worker_job_id: str) -> SubmitInferenceJobRequest | None:
        with self._lock:
            job = self._jobs.get(worker_job_id)

            if job is None or job.status != "queued":
                return None

            job.status = "processing"
            job.updated_at = datetime.now(UTC)
            return job.request

    def _persist_execution_result(self, worker_job_id: str, result: InferenceResult) -> None:
        with self._lock:
            job = self._jobs.get(worker_job_id)

            if job is None or job.status != "processing":
                return

            job.updated_at = datetime.now(UTC)
            job.duration_ms = result.duration_ms

            if result.success and result.result is not None:
                job.status = "succeeded"
                job.result = result.result
                job.error = None
                return

            job.status = "failed"
            job.error = result.error or WorkerError(
                code="inference_failed",
                message="Inference failed without a normalized error.",
                retryable=False,
            )

    def wait_for_terminal_status(
        self,
        worker_job_id: str,
        *,
        timeout_seconds: float = 5.0,
        poll_interval_seconds: float = 0.01,
    ) -> WorkerJob | None:
        """Wait for tests or manual checks to observe a terminal state."""
        deadline = time.monotonic() + timeout_seconds

        while time.monotonic() <= deadline:
            job = self.get(worker_job_id)
            if job is None or job.status in {"succeeded", "failed", "cancelled"}:
                return job
            time.sleep(poll_interval_seconds)

        return self.get(worker_job_id)

    def to_status_response(self, job: WorkerJob) -> WorkerJobStatusResponse:
        result = job.result

        return WorkerJobStatusResponse(
            workerJobId=job.worker_job_id,
            status=job.status,
            error=job.error,
            outputArtifactPath=None if result is None else result.outputArtifactPath,
            mediaType=None if result is None else result.mediaType,
            width=None if result is None else result.width,
            height=None if result is None else result.height,
            fileSize=None if result is None else result.fileSize,
            modelId=None if result is None else result.modelId,
            modelVersion=None if result is None else result.modelVersion,
            durationMs=job.duration_ms,
            metadata=None if result is None else result.metadata,
        )
