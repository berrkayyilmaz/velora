from __future__ import annotations

from pathlib import Path
from typing import Any

from fastapi.testclient import TestClient
from src.app import create_app


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


def test_health_endpoint() -> None:
    client = TestClient(create_app())

    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {
        "status": "ok",
        "service": "velora-ai-worker",
    }


def test_submit_status_success_and_result_contract(tmp_path: Path) -> None:
    client = TestClient(create_app())
    output_path = tmp_path / "result.png"

    submit_response = client.post("/jobs", json=create_request(output_path))

    assert submit_response.status_code == 202
    submit_body = submit_response.json()
    assert set(submit_body) == {"workerJobId", "status"}
    assert submit_body["status"] == "queued"
    worker_job_id = submit_body["workerJobId"]

    processing_response = client.get(f"/jobs/{worker_job_id}")

    assert processing_response.status_code == 200
    assert processing_response.json()["status"] == "processing"

    succeeded_response = client.get(f"/jobs/{worker_job_id}")

    assert succeeded_response.status_code == 200
    succeeded_body = succeeded_response.json()
    assert succeeded_body["workerJobId"] == worker_job_id
    assert succeeded_body["status"] == "succeeded"
    assert succeeded_body["outputArtifactPath"] == str(output_path)
    assert output_path.exists()

    result_response = client.get(f"/jobs/{worker_job_id}/result")

    assert result_response.status_code == 200
    result_body = result_response.json()
    assert result_body["workerJobId"] == worker_job_id
    assert result_body["status"] == "succeeded"
    assert result_body["outputArtifactPath"] == str(output_path)
    assert result_body["mediaType"] == "image/png"
    assert result_body["width"] == 768
    assert result_body["height"] == 1024
    assert result_body["fileSize"] > 0
    assert result_body["modelId"] == "fake-remote-vton"
    assert result_body["modelVersion"] == "fake-remote-0.1"


def test_cancel_queued_job() -> None:
    client = TestClient(create_app())
    submit_response = client.post("/jobs", json=create_request(Path("unused.png")))
    worker_job_id = submit_response.json()["workerJobId"]

    cancel_response = client.post(f"/jobs/{worker_job_id}/cancel")

    assert cancel_response.status_code == 200
    assert cancel_response.json() == {
        "workerJobId": worker_job_id,
        "status": "cancelled",
        "cancelled": True,
    }

    status_response = client.get(f"/jobs/{worker_job_id}")
    assert status_response.status_code == 200
    assert status_response.json()["status"] == "cancelled"


def test_fake_failure_result(tmp_path: Path) -> None:
    client = TestClient(create_app())
    output_path = tmp_path / "force-fail.png"
    submit_response = client.post(
        "/jobs",
        json=create_request(output_path, person_image_asset_id="force-fail-person.png"),
    )
    worker_job_id = submit_response.json()["workerJobId"]

    assert client.get(f"/jobs/{worker_job_id}").json()["status"] == "processing"
    failed_response = client.get(f"/jobs/{worker_job_id}")

    assert failed_response.status_code == 200
    failed_body = failed_response.json()
    assert failed_body["status"] == "failed"
    assert failed_body["error"] == {
        "code": "fake_inference_failed",
        "message": "Fake deterministic inference failure.",
        "retryable": False,
    }
    assert not output_path.exists()

    result_response = client.get(f"/jobs/{worker_job_id}/result")
    assert result_response.status_code == 409


def test_missing_job_returns_404() -> None:
    client = TestClient(create_app())

    assert client.get("/jobs/missing").status_code == 404
    assert client.post("/jobs/missing/cancel").status_code == 404
    assert client.get("/jobs/missing/result").status_code == 404


def test_request_validation_rejects_unknown_garment_source(tmp_path: Path) -> None:
    client = TestClient(create_app())
    request = create_request(tmp_path / "result.png")
    request["garmentSource"] = {
        "type": "unknown",
        "productId": "product-1",
    }

    response = client.post("/jobs", json=request)

    assert response.status_code == 422
