from __future__ import annotations

import time
from pathlib import Path
from threading import Event, Lock
from typing import Any

from fastapi.testclient import TestClient
from src.app import create_app
from src.executor import InferenceResult
from src.models import ResultMetadataResponse, SubmitInferenceJobRequest, WorkerError
from src.storage import InMemoryJobStore


def create_request(output_path: Path, person_image_asset_id: str = "person.png") -> dict[str, Any]:
    return {
        "jobId": "backend-job-1",
        "personImageAssetId": person_image_asset_id,
        "garmentSource": {
            "type": "catalog_product",
            "productId": "product-1",
        },
        "outfitId": None,
        "outputArtifactPath": str(output_path),
    }


def create_success_result(
    worker_job_id: str,
    request: SubmitInferenceJobRequest,
    *,
    duration_ms: float = 25.0,
) -> InferenceResult:
    output_path = Path(request.outputArtifactPath)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(f"fake output for {worker_job_id}", encoding="utf-8")

    return InferenceResult(
        success=True,
        duration_ms=duration_ms,
        result=ResultMetadataResponse(
            workerJobId=worker_job_id,
            status="succeeded",
            outputArtifactPath=str(output_path),
            mediaType="image/png",
            width=768,
            height=1024,
            fileSize=output_path.stat().st_size,
            modelId="test-executor",
            modelVersion="test-0.1",
            durationMs=duration_ms,
        ),
    )


def wait_for_status(
    client: TestClient,
    worker_job_id: str,
    expected_status: str,
    *,
    timeout_seconds: float = 2.0,
) -> dict[str, Any]:
    deadline = time.monotonic() + timeout_seconds
    last_body: dict[str, Any] | None = None

    while time.monotonic() <= deadline:
        response = client.get(f"/jobs/{worker_job_id}")
        assert response.status_code == 200
        last_body = response.json()
        if last_body["status"] == expected_status:
            return last_body
        time.sleep(0.01)

    raise AssertionError(f"Timed out waiting for {expected_status}. Last body: {last_body}")


class BlockingExecutor:
    def __init__(self) -> None:
        self.started = Event()
        self.release = Event()
        self.calls: list[str] = []
        self._lock = Lock()

    def execute(
        self,
        worker_job_id: str,
        request: SubmitInferenceJobRequest,
    ) -> InferenceResult:
        with self._lock:
            self.calls.append(worker_job_id)

        self.started.set()
        if not self.release.wait(timeout=3.0):
            raise RuntimeError("Blocking test executor was not released.")

        return create_success_result(worker_job_id, request, duration_ms=100.0)


class FailingExecutor:
    def __init__(self) -> None:
        self.call_count = 0

    def execute(
        self,
        worker_job_id: str,
        request: SubmitInferenceJobRequest,
    ) -> InferenceResult:
        self.call_count += 1
        return InferenceResult(
            success=False,
            duration_ms=12.0,
            error=WorkerError(
                code="mock_inference_failed",
                message=f"Mock failure for {worker_job_id}.",
                retryable=False,
            ),
        )


class RaisingExecutor:
    def execute(
        self,
        worker_job_id: str,
        request: SubmitInferenceJobRequest,
    ) -> InferenceResult:
        raise RuntimeError(f"Unexpected executor failure for {worker_job_id}.")


def submit_stored_job(store: InMemoryJobStore, request: dict[str, Any]) -> str:
    job = store.submit(SubmitInferenceJobRequest.model_validate(request))
    return job.worker_job_id


def test_health_endpoint() -> None:
    with TestClient(create_app()) as client:
        response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {
        "status": "ok",
        "service": "velora-ai-worker",
    }


def test_submit_returns_queued_and_background_status_is_responsive(tmp_path: Path) -> None:
    executor = BlockingExecutor()
    store = InMemoryJobStore(executor)

    with TestClient(create_app(store, artifact_output_directory=tmp_path)) as client:
        output_path = tmp_path / "result.png"
        started_at = time.monotonic()

        submit_response = client.post("/jobs", json=create_request(output_path))

        elapsed = time.monotonic() - started_at
        assert elapsed < 1.0
        assert submit_response.status_code == 202
        submit_body = submit_response.json()
        assert submit_body["status"] == "queued"
        worker_job_id = submit_body["workerJobId"]
        assert executor.started.wait(timeout=1.0)

        status_started_at = time.monotonic()
        processing_response = client.get(f"/jobs/{worker_job_id}")

        assert time.monotonic() - status_started_at < 1.0
        assert processing_response.status_code == 200
        assert processing_response.json()["status"] == "processing"
        assert client.get(f"/jobs/{worker_job_id}/result").status_code == 409

        for _ in range(5):
            repeated_status_response = client.get(f"/jobs/{worker_job_id}")
            assert repeated_status_response.status_code == 200
            assert repeated_status_response.json()["status"] == "processing"

        assert executor.calls == [worker_job_id]

        executor.release.set()
        succeeded_body = wait_for_status(client, worker_job_id, "succeeded")

        artifact_path = Path(succeeded_body["outputArtifactPath"])
        assert artifact_path.parent == tmp_path
        assert succeeded_body["durationMs"] == 100.0
        assert artifact_path.exists()
        assert not output_path.exists()

        result_response = client.get(f"/jobs/{worker_job_id}/result")

    assert result_response.status_code == 200
    result_body = result_response.json()
    assert result_body["workerJobId"] == worker_job_id
    assert result_body["status"] == "succeeded"
    assert result_body["outputArtifactPath"] == str(artifact_path)
    assert result_body["modelId"] == "test-executor"


def test_submit_status_success_and_result_contract_with_fake_executor(tmp_path: Path) -> None:
    with TestClient(create_app(artifact_output_directory=tmp_path)) as client:
        output_path = tmp_path / "result.png"

        submit_response = client.post("/jobs", json=create_request(output_path))

        assert submit_response.status_code == 202
        submit_body = submit_response.json()
        assert set(submit_body) == {"workerJobId", "status"}
        assert submit_body["status"] == "queued"
        worker_job_id = submit_body["workerJobId"]

        succeeded_body = wait_for_status(client, worker_job_id, "succeeded")

        assert succeeded_body["workerJobId"] == worker_job_id
        artifact_path = Path(succeeded_body["outputArtifactPath"])
        assert artifact_path.parent == tmp_path
        assert artifact_path.exists()
        assert not output_path.exists()

        result_response = client.get(f"/jobs/{worker_job_id}/result")

    assert result_response.status_code == 200
    result_body = result_response.json()
    assert result_body["workerJobId"] == worker_job_id
    assert result_body["status"] == "succeeded"
    assert result_body["outputArtifactPath"] == str(artifact_path)
    assert result_body["mediaType"] == "image/png"
    assert result_body["width"] == 768
    assert result_body["height"] == 1024
    assert result_body["fileSize"] > 0
    assert result_body["modelId"] == "fake-remote-vton"
    assert result_body["modelVersion"] == "fake-remote-0.1"


def test_successful_artifact_download_returns_bytes_and_media_type(tmp_path: Path) -> None:
    with TestClient(create_app(artifact_output_directory=tmp_path)) as client:
        output_path = tmp_path / "result.png"
        submit_response = client.post("/jobs", json=create_request(output_path))
        worker_job_id = submit_response.json()["workerJobId"]
        succeeded_body = wait_for_status(client, worker_job_id, "succeeded")
        artifact_path = Path(succeeded_body["outputArtifactPath"])

        artifact_response = client.get(f"/jobs/{worker_job_id}/artifact")

    assert artifact_response.status_code == 200
    assert artifact_response.headers["content-type"] == "image/png"
    assert artifact_response.content == artifact_path.read_bytes()
    assert artifact_path != output_path


def test_unknown_job_artifact_returns_404() -> None:
    with TestClient(create_app()) as client:
        response = client.get("/jobs/missing/artifact")

    assert response.status_code == 404


def test_unfinished_failed_and_cancelled_jobs_cannot_download_artifacts(tmp_path: Path) -> None:
    queued_store = InMemoryJobStore()
    queued_job_id = submit_stored_job(queued_store, create_request(tmp_path / "queued.png"))

    with TestClient(create_app(queued_store, artifact_output_directory=tmp_path)) as queued_client:
        queued_response = queued_client.get(f"/jobs/{queued_job_id}/artifact")

    assert queued_response.status_code == 409
    assert queued_response.json()["detail"] == "Worker job artifact is not ready."

    processing_executor = BlockingExecutor()
    processing_store = InMemoryJobStore(processing_executor)
    with TestClient(
        create_app(processing_store, artifact_output_directory=tmp_path)
    ) as processing_client:
        submit_response = processing_client.post(
            "/jobs", json=create_request(tmp_path / "processing.png")
        )
        processing_job_id = submit_response.json()["workerJobId"]
        assert processing_executor.started.wait(timeout=1.0)
        processing_response = processing_client.get(f"/jobs/{processing_job_id}/artifact")
        processing_executor.release.set()

    assert processing_response.status_code == 409
    assert processing_response.json()["detail"] == "Worker job artifact is not ready."

    failed_store = InMemoryJobStore(FailingExecutor())
    with TestClient(create_app(failed_store, artifact_output_directory=tmp_path)) as failed_client:
        submit_response = failed_client.post("/jobs", json=create_request(tmp_path / "failed.png"))
        failed_job_id = submit_response.json()["workerJobId"]
        wait_for_status(failed_client, failed_job_id, "failed")
        failed_response = failed_client.get(f"/jobs/{failed_job_id}/artifact")

    assert failed_response.status_code == 409
    assert failed_response.json()["detail"] == "Worker job did not produce an artifact."

    cancelled_store = InMemoryJobStore()
    cancelled_job_id = submit_stored_job(
        cancelled_store, create_request(tmp_path / "cancelled.png")
    )
    cancelled_store.cancel(cancelled_job_id)

    with TestClient(
        create_app(cancelled_store, artifact_output_directory=tmp_path)
    ) as cancelled_client:
        cancelled_response = cancelled_client.get(f"/jobs/{cancelled_job_id}/artifact")

    assert cancelled_response.status_code == 409
    assert cancelled_response.json()["detail"] == "Worker job did not produce an artifact."


def test_missing_artifact_file_returns_404(tmp_path: Path) -> None:
    with TestClient(create_app(artifact_output_directory=tmp_path)) as client:
        output_path = tmp_path / "missing-after-success.png"
        submit_response = client.post("/jobs", json=create_request(output_path))
        worker_job_id = submit_response.json()["workerJobId"]
        succeeded_body = wait_for_status(client, worker_job_id, "succeeded")
        Path(succeeded_body["outputArtifactPath"]).unlink()

        artifact_response = client.get(f"/jobs/{worker_job_id}/artifact")

    assert artifact_response.status_code == 404
    assert artifact_response.json()["detail"] == "Worker job artifact was not found."


def test_artifact_path_outside_configured_output_directory_is_rejected(tmp_path: Path) -> None:
    artifact_root = tmp_path / "allowed"
    artifact_root.mkdir()
    outside_path = tmp_path / "outside.png"
    store = InMemoryJobStore()
    worker_job_id = submit_stored_job(store, create_request(outside_path))
    store.execute_job(worker_job_id)

    with TestClient(create_app(store, artifact_output_directory=artifact_root)) as client:
        artifact_response = client.get(f"/jobs/{worker_job_id}/artifact")

    assert artifact_response.status_code == 409
    assert artifact_response.json()["detail"] == (
        "Worker job artifact is outside the configured output directory."
    )


def test_queued_cancellation_prevents_execution(tmp_path: Path) -> None:
    executor = BlockingExecutor()
    store = InMemoryJobStore(executor)

    with TestClient(create_app(store, max_workers=1, artifact_output_directory=tmp_path)) as client:
        first_response = client.post("/jobs", json=create_request(tmp_path / "first.png"))
        first_job_id = first_response.json()["workerJobId"]
        assert executor.started.wait(timeout=1.0)

        second_response = client.post("/jobs", json=create_request(tmp_path / "second.png"))
        second_job_id = second_response.json()["workerJobId"]
        assert second_response.json()["status"] == "queued"
        assert client.get(f"/jobs/{second_job_id}").json()["status"] == "queued"

        cancel_response = client.post(f"/jobs/{second_job_id}/cancel")

        assert cancel_response.status_code == 200
        assert cancel_response.json() == {
            "workerJobId": second_job_id,
            "status": "cancelled",
            "cancelled": True,
        }

        executor.release.set()
        wait_for_status(client, first_job_id, "succeeded")
        second_status = client.get(f"/jobs/{second_job_id}").json()

    assert second_status["status"] == "cancelled"
    assert executor.calls == [first_job_id]


def test_processing_cancellation_is_not_overwritten_by_completion(tmp_path: Path) -> None:
    executor = BlockingExecutor()
    store = InMemoryJobStore(executor)

    with TestClient(create_app(store, artifact_output_directory=tmp_path)) as client:
        submit_response = client.post("/jobs", json=create_request(tmp_path / "cancelled.png"))
        worker_job_id = submit_response.json()["workerJobId"]
        assert executor.started.wait(timeout=1.0)

        cancel_response = client.post(f"/jobs/{worker_job_id}/cancel")

        assert cancel_response.status_code == 200
        assert cancel_response.json()["status"] == "cancelled"

        executor.release.set()
        time.sleep(0.05)
        status_response = client.get(f"/jobs/{worker_job_id}")

    assert status_response.status_code == 200
    assert status_response.json()["status"] == "cancelled"


def test_executor_failure_result(tmp_path: Path) -> None:
    executor = FailingExecutor()
    store = InMemoryJobStore(executor)

    with TestClient(create_app(store, artifact_output_directory=tmp_path)) as client:
        submit_response = client.post("/jobs", json=create_request(tmp_path / "failed.png"))
        worker_job_id = submit_response.json()["workerJobId"]

        failed_body = wait_for_status(client, worker_job_id, "failed")
        result_response = client.get(f"/jobs/{worker_job_id}/result")

    assert failed_body["error"] == {
        "code": "mock_inference_failed",
        "message": f"Mock failure for {worker_job_id}.",
        "retryable": False,
    }
    assert executor.call_count == 1
    assert result_response.status_code == 409


def test_executor_exception_becomes_failed_without_crashing(tmp_path: Path) -> None:
    store = InMemoryJobStore(RaisingExecutor())

    with TestClient(create_app(store, artifact_output_directory=tmp_path)) as client:
        submit_response = client.post("/jobs", json=create_request(tmp_path / "exception.png"))
        worker_job_id = submit_response.json()["workerJobId"]

        failed_body = wait_for_status(client, worker_job_id, "failed")

    assert failed_body["error"]["code"] == "worker_executor_exception"
    assert failed_body["error"]["retryable"] is False
    assert "Unexpected executor failure" in failed_body["error"]["message"]


def test_fake_failure_result(tmp_path: Path) -> None:
    with TestClient(create_app()) as client:
        output_path = tmp_path / "force-fail.png"
        submit_response = client.post(
            "/jobs",
            json=create_request(output_path, person_image_asset_id="force-fail-person.png"),
        )
        worker_job_id = submit_response.json()["workerJobId"]

        failed_body = wait_for_status(client, worker_job_id, "failed")
        result_response = client.get(f"/jobs/{worker_job_id}/result")

    assert failed_body["error"] == {
        "code": "fake_inference_failed",
        "message": "Fake deterministic inference failure.",
        "retryable": False,
    }
    assert not output_path.exists()
    assert result_response.status_code == 409


def test_missing_job_returns_404() -> None:
    with TestClient(create_app()) as client:
        assert client.get("/jobs/missing").status_code == 404
        assert client.post("/jobs/missing/cancel").status_code == 404
        assert client.get("/jobs/missing/result").status_code == 404


def test_request_validation_rejects_unknown_garment_source(tmp_path: Path) -> None:
    with TestClient(create_app()) as client:
        request = create_request(tmp_path / "result.png")
        request["garmentSource"] = {
            "type": "unknown",
            "productId": "product-1",
        }

        response = client.post("/jobs", json=request)

    assert response.status_code == 422
