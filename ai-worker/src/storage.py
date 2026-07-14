"""Thread-safe in-memory storage for remote worker jobs."""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import UTC, datetime
from threading import Lock
from uuid import uuid4

from src.executor import FakeInferenceExecutor, InferenceExecutor
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

    def advance(self, worker_job_id: str) -> WorkerJob | None:
        with self._lock:
            job = self._jobs.get(worker_job_id)

            if job is None:
                return None

            if job.status == "queued":
                job.status = "processing"
                job.updated_at = datetime.now(UTC)
                return job

            if job.status == "processing":
                result = self._executor.execute(worker_job_id, job.request)
                job.updated_at = datetime.now(UTC)

                if result.success and result.result is not None:
                    job.status = "succeeded"
                    job.result = result.result
                    job.error = None
                    job.duration_ms = result.duration_ms
                    return job

                job.status = "failed"
                job.duration_ms = result.duration_ms
                job.error = result.error or WorkerError(
                    code="fake_inference_failed",
                    message="Fake deterministic inference failed.",
                    retryable=False,
                )

            return job

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
