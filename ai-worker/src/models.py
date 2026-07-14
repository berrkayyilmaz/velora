"""Request and response contracts for the remote try-on worker."""

from __future__ import annotations

from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, Field

WorkerJobStatus = Literal["queued", "processing", "succeeded", "failed", "cancelled"]


class CatalogProductGarmentSource(BaseModel):
    """Catalog product garment source from the Velora backend."""

    model_config = ConfigDict(extra="forbid")

    type: Literal["catalog_product"]
    productId: str = Field(min_length=1)


class WardrobeItemGarmentSource(BaseModel):
    """User wardrobe garment source from the Velora backend."""

    model_config = ConfigDict(extra="forbid")

    type: Literal["wardrobe_item"]
    wardrobeItemId: str = Field(min_length=1)


GarmentSource = Annotated[
    CatalogProductGarmentSource | WardrobeItemGarmentSource,
    Field(discriminator="type"),
]


class SubmitInferenceJobRequest(BaseModel):
    """Remote worker submit request matching backend TryOnInferenceRequest."""

    model_config = ConfigDict(extra="forbid")

    jobId: str = Field(min_length=1)
    personImageAssetId: str = Field(min_length=1)
    garmentSource: GarmentSource
    outfitId: str | None = None
    outputArtifactPath: str = Field(min_length=1)


class WorkerError(BaseModel):
    """Normalized worker error contract."""

    model_config = ConfigDict(extra="forbid")

    code: str = Field(min_length=1)
    message: str = Field(min_length=1)
    retryable: bool = False


class SubmitInferenceJobResponse(BaseModel):
    """Remote worker submit response."""

    workerJobId: str = Field(min_length=1)
    status: WorkerJobStatus


class WorkerJobStatusResponse(BaseModel):
    """Remote worker job status response."""

    workerJobId: str = Field(min_length=1)
    status: WorkerJobStatus
    error: WorkerError | None = None
    outputArtifactPath: str | None = None
    mediaType: str | None = None
    width: int | None = None
    height: int | None = None
    fileSize: int | None = None
    modelId: str | None = None
    modelVersion: str | None = None


class CancelWorkerJobResponse(BaseModel):
    """Remote worker cancellation response."""

    workerJobId: str = Field(min_length=1)
    status: WorkerJobStatus
    cancelled: bool


class ResultMetadataResponse(BaseModel):
    """Remote worker result metadata response."""

    workerJobId: str = Field(min_length=1)
    status: Literal["succeeded"]
    outputArtifactPath: str = Field(min_length=1)
    mediaType: str = Field(min_length=1)
    width: int = Field(gt=0)
    height: int = Field(gt=0)
    fileSize: int = Field(ge=0)
    modelId: str | None = None
    modelVersion: str | None = None


class HealthResponse(BaseModel):
    """Health response for worker infrastructure checks."""

    status: Literal["ok"]
    service: Literal["velora-ai-worker"]
