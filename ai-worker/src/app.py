"""FastAPI application for the remote try-on worker foundation."""

from __future__ import annotations

from collections.abc import AsyncIterator
from concurrent.futures import ThreadPoolExecutor
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, HTTPException, status
from fastapi.responses import FileResponse

from src.config import load_worker_config
from src.factory import create_executor
from src.models import (
    CancelWorkerJobResponse,
    HealthResponse,
    ResultMetadataResponse,
    SubmitInferenceJobRequest,
    SubmitInferenceJobResponse,
    WorkerJobStatusResponse,
)
from src.storage import InMemoryJobStore, WorkerJob


def create_app(
    job_store: InMemoryJobStore | None = None,
    *,
    max_workers: int = 1,
    artifact_output_directory: Path | None = None,
) -> FastAPI:
    """Create the FastAPI worker app."""
    config = load_worker_config()
    store = job_store or InMemoryJobStore(create_executor(config))
    artifact_root = artifact_output_directory or config.artifact_output_directory
    executor_pool = ThreadPoolExecutor(
        max_workers=max_workers,
        thread_name_prefix="velora-ai-worker",
    )

    @asynccontextmanager
    async def lifespan(_app: FastAPI) -> AsyncIterator[None]:
        try:
            yield
        finally:
            executor_pool.shutdown(wait=False, cancel_futures=True)

    app = FastAPI(
        title="Velora AI Worker",
        version="0.1.0",
        description="Remote try-on worker foundation with deterministic fake inference.",
        lifespan=lifespan,
    )

    @app.get("/health", response_model=HealthResponse)
    def health() -> HealthResponse:
        return HealthResponse(status="ok", service="velora-ai-worker")

    @app.post(
        "/jobs",
        response_model=SubmitInferenceJobResponse,
        status_code=status.HTTP_202_ACCEPTED,
    )
    def submit_job(request: SubmitInferenceJobRequest) -> SubmitInferenceJobResponse:
        job = store.submit(request, output_directory=artifact_root)
        response = SubmitInferenceJobResponse(workerJobId=job.worker_job_id, status=job.status)
        executor_pool.submit(store.execute_job, job.worker_job_id)
        return response

    @app.get("/jobs/{worker_job_id}", response_model=WorkerJobStatusResponse)
    def get_job(worker_job_id: str) -> WorkerJobStatusResponse:
        job = store.get(worker_job_id)

        if job is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Worker job not found."
            )

        return store.to_status_response(job)

    @app.post("/jobs/{worker_job_id}/cancel", response_model=CancelWorkerJobResponse)
    def cancel_job(worker_job_id: str) -> CancelWorkerJobResponse:
        job = store.cancel(worker_job_id)

        if job is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Worker job not found."
            )

        return CancelWorkerJobResponse(
            workerJobId=job.worker_job_id,
            status=job.status,
            cancelled=job.status == "cancelled",
        )

    @app.get("/jobs/{worker_job_id}/result", response_model=ResultMetadataResponse)
    def get_result(worker_job_id: str) -> ResultMetadataResponse:
        job = store.get(worker_job_id)

        if job is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Worker job not found."
            )

        if job.status != "succeeded" or job.result is None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Worker job result is not ready.",
            )

        return job.result

    @app.get("/jobs/{worker_job_id}/artifact")
    def get_artifact(worker_job_id: str) -> FileResponse:
        job = store.get(worker_job_id)

        if job is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Worker job not found."
            )

        artifact_path = resolve_artifact_path(job, artifact_root)

        if not artifact_path.exists() or not artifact_path.is_file():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Worker job artifact was not found.",
            )

        media_type = job.result.mediaType if job.result is not None else "application/octet-stream"
        return FileResponse(
            artifact_path,
            media_type=media_type,
            filename=safe_artifact_filename(worker_job_id, artifact_path),
        )

    return app


app = create_app()


def resolve_artifact_path(job: WorkerJob, artifact_root: Path) -> Path:
    """Resolve a completed job artifact without exposing arbitrary filesystem paths."""
    if job.status in {"queued", "processing"}:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Worker job artifact is not ready.",
        )

    if job.status in {"failed", "cancelled"}:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Worker job did not produce an artifact.",
        )

    if job.result is None or job.result.outputArtifactPath.strip() == "":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Worker job artifact metadata is missing.",
        )

    root = artifact_root.resolve()
    artifact_path = Path(job.result.outputArtifactPath).resolve()

    try:
        artifact_path.relative_to(root)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Worker job artifact is outside the configured output directory.",
        ) from None

    return artifact_path


def safe_artifact_filename(worker_job_id: str, artifact_path: Path) -> str:
    suffix = artifact_path.suffix.lower()
    if suffix not in {".png", ".jpg", ".jpeg", ".webp"}:
        suffix = ".png"
    return f"{worker_job_id}{suffix}"
