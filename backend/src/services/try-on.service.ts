import type { PrismaClient, TryOnJobStatus as DatabaseTryOnJobStatus } from "@prisma/client";

import {
  completeTryOnJobWithResult,
  createTryOnJobRecord,
  expireTryOnJob,
  findActiveTryOnProduct,
  findCurrentTryOnConsent,
  findEligibleTryOnWardrobeItem,
  findOutfitProductForTryOn,
  findOutfitWardrobeItemForTryOn,
  findOwnedOutfitForTryOn,
  findTryOnJobById,
  findUserTryOnJobById,
  findUserTryOnJobByIdempotencyKey,
  listUserTryOnJobs,
  PrismaTryOnJobStatus,
  touchTryOnJobHeartbeat,
  transitionTryOnJobStatus,
  updateTryOnJobStatus,
  type TryOnJobRecord,
  type TryOnResultRecord
} from "../repositories/try-on.repository.js";
import type {
  CreateTryOnJobRequest,
  DeleteTryOnJobResponse,
  TryOnJobListQuery,
  TryOnJobListResponse,
  TryOnJobResponse,
  TryOnJobResponseData,
  TryOnJobStatus
} from "../schemas/try-on.schemas.js";

const TRY_ON_RESULT_RETENTION_DAYS = 30;

const cancellableStatuses = [
  PrismaTryOnJobStatus.QUEUED,
  PrismaTryOnJobStatus.VALIDATING,
  PrismaTryOnJobStatus.PROCESSING
];

export class TryOnServiceError extends Error {
  constructor(
    readonly code: string,
    readonly statusCode: number,
    message: string
  ) {
    super(message);
    this.name = "TryOnServiceError";
  }
}

export type CreateTryOnJobResult = {
  response: TryOnJobResponse;
  created: boolean;
};

export type CompleteTryOnJobInput = {
  storageKey: string;
  mediaType: string;
  provider: string;
  providerVersion?: string;
  modelVersion?: string;
  width?: number;
  height?: number;
  fileSize?: number;
  expiresAt?: Date;
};

export type FailTryOnJobInput = {
  code: string;
  message: string;
};

function toApiStatus(status: DatabaseTryOnJobStatus): TryOnJobStatus {
  return status.toLowerCase() as TryOnJobStatus;
}

function toResultStatus(status: TryOnResultRecord["status"]) {
  return status.toLowerCase() as "ready" | "failed" | "deletion_pending" | "deleted";
}

function toTryOnResult(result: TryOnResultRecord): TryOnJobResponseData["result"] {
  return {
    id: result.id,
    jobId: result.jobId,
    status: toResultStatus(result.status),
    mediaType: result.mediaType,
    width: result.width,
    height: result.height,
    url: null,
    expiresAt: result.expiresAt?.toISOString() ?? null,
    createdAt: result.createdAt.toISOString(),
    deletedAt: result.deletedAt?.toISOString() ?? null
  };
}

function toTryOnJob(job: TryOnJobRecord): TryOnJobResponseData {
  const garmentSource =
    job.productId === null
      ? {
          type: "wardrobe_item" as const,
          wardrobeItemId: job.wardrobeItemId as string
        }
      : {
          type: "catalog_product" as const,
          productId: job.productId
        };

  return {
    id: job.id,
    status: toApiStatus(job.status),
    personImage: {
      type: "temporary_upload"
    },
    garmentSource,
    outfitId: job.outfitId,
    provider: job.provider,
    providerVersion: job.providerVersion,
    modelVersion: job.modelVersion,
    attemptCount: job.attemptCount,
    failureCode: job.failureCode,
    failureMessage: job.failureMessage,
    result: job.result === null ? null : toTryOnResult(job.result),
    createdAt: job.createdAt.toISOString(),
    updatedAt: job.updatedAt.toISOString(),
    completedAt: job.completedAt?.toISOString() ?? null,
    expiresAt: job.expiresAt?.toISOString() ?? null
  };
}

function retentionExpiry(): Date {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + TRY_ON_RESULT_RETENTION_DAYS);
  return expiresAt;
}

function idempotencyMatches(job: TryOnJobRecord, input: CreateTryOnJobRequest): boolean {
  return (
    job.personImageStorageKey === input.personImageAssetId &&
    job.productId === (input.productId ?? null) &&
    job.wardrobeItemId === (input.wardrobeItemId ?? null) &&
    job.outfitId === (input.outfitId ?? null)
  );
}

async function validateConsent(prisma: PrismaClient, userId: string): Promise<string> {
  const consent = await findCurrentTryOnConsent(prisma, userId);

  if (consent === null) {
    throw new TryOnServiceError(
      "TRY_ON_CONSENT_REQUIRED",
      409,
      "Try-on consent is required before creating a job."
    );
  }

  return consent.id;
}

async function validateProductSource(prisma: PrismaClient, productId: string): Promise<void> {
  const product = await findActiveTryOnProduct(prisma, productId);

  if (product === null) {
    throw new TryOnServiceError("TRY_ON_GARMENT_NOT_FOUND", 404, "Catalog product was not found.");
  }
}

async function validateWardrobeSource(
  prisma: PrismaClient,
  userId: string,
  wardrobeItemId: string
): Promise<void> {
  const wardrobeItem = await findEligibleTryOnWardrobeItem(prisma, userId, wardrobeItemId);

  if (wardrobeItem === null) {
    throw new TryOnServiceError(
      "TRY_ON_GARMENT_NOT_FOUND",
      404,
      "Wardrobe item was not found or is not eligible for try-on."
    );
  }
}

async function validateOutfitContext(
  prisma: PrismaClient,
  userId: string,
  input: CreateTryOnJobRequest
): Promise<void> {
  if (input.outfitId === undefined) {
    return;
  }

  const outfit = await findOwnedOutfitForTryOn(prisma, userId, input.outfitId);

  if (outfit === null) {
    throw new TryOnServiceError("OUTFIT_NOT_FOUND", 404, "Outfit was not found.");
  }

  if (input.productId !== undefined) {
    const outfitProduct = await findOutfitProductForTryOn(prisma, input.outfitId, input.productId);

    if (outfitProduct === null) {
      throw new TryOnServiceError(
        "TRY_ON_OUTFIT_SOURCE_MISMATCH",
        409,
        "Catalog product is not part of the outfit context."
      );
    }
  }

  if (input.wardrobeItemId !== undefined) {
    const outfitWardrobeItem = await findOutfitWardrobeItemForTryOn(
      prisma,
      input.outfitId,
      input.wardrobeItemId
    );

    if (outfitWardrobeItem === null) {
      throw new TryOnServiceError(
        "TRY_ON_OUTFIT_SOURCE_MISMATCH",
        409,
        "Wardrobe item is not part of the outfit context."
      );
    }
  }
}

function resolveIdempotencyKey(
  input: CreateTryOnJobRequest,
  headerValue: string | undefined
): string | undefined {
  const normalizedHeader = headerValue?.trim();

  if (normalizedHeader !== undefined && normalizedHeader.length > 0) {
    return normalizedHeader;
  }

  return input.idempotencyKey;
}

export async function createTryOnJob(
  prisma: PrismaClient,
  userId: string,
  input: CreateTryOnJobRequest,
  idempotencyHeader: string | undefined
): Promise<CreateTryOnJobResult> {
  const idempotencyKey = resolveIdempotencyKey(input, idempotencyHeader);

  if (idempotencyKey !== undefined) {
    const existingJob = await findUserTryOnJobByIdempotencyKey(prisma, userId, idempotencyKey);

    if (existingJob !== null) {
      if (!idempotencyMatches(existingJob, input)) {
        throw new TryOnServiceError(
          "TRY_ON_IDEMPOTENCY_CONFLICT",
          409,
          "Idempotency key was already used for a different try-on request."
        );
      }

      return {
        response: {
          data: toTryOnJob(existingJob)
        },
        created: false
      };
    }
  }

  const consentId = await validateConsent(prisma, userId);

  if (input.productId !== undefined) {
    await validateProductSource(prisma, input.productId);
  }

  if (input.wardrobeItemId !== undefined) {
    await validateWardrobeSource(prisma, userId, input.wardrobeItemId);
  }

  await validateOutfitContext(prisma, userId, input);

  const job = await createTryOnJobRecord(prisma, {
    userId,
    consentId,
    personImageStorageKey: input.personImageAssetId,
    ...(input.productId === undefined ? {} : { productId: input.productId }),
    ...(input.wardrobeItemId === undefined ? {} : { wardrobeItemId: input.wardrobeItemId }),
    ...(input.outfitId === undefined ? {} : { outfitId: input.outfitId }),
    ...(idempotencyKey === undefined ? {} : { idempotencyKey }),
    expiresAt: retentionExpiry()
  });

  return {
    response: {
      data: toTryOnJob(job)
    },
    created: true
  };
}

export async function listTryOnJobs(
  prisma: PrismaClient,
  userId: string,
  query: TryOnJobListQuery
): Promise<TryOnJobListResponse> {
  const { items, total } = await listUserTryOnJobs(prisma, userId, query);

  return {
    data: {
      items: items.map(toTryOnJob)
    },
    meta: {
      pagination: {
        page: query.page,
        pageSize: query.pageSize,
        total,
        hasNextPage: query.page * query.pageSize < total
      },
      appliedFilters: {
        ...(query.status === undefined ? {} : { status: query.status })
      }
    }
  };
}

export async function getTryOnJob(
  prisma: PrismaClient,
  userId: string,
  jobId: string
): Promise<TryOnJobResponse> {
  const job = await findUserTryOnJobById(prisma, userId, jobId);

  if (job === null) {
    throw new TryOnServiceError("TRY_ON_JOB_NOT_FOUND", 404, "Try-on job was not found.");
  }

  return {
    data: toTryOnJob(job)
  };
}

export async function cancelTryOnJob(
  prisma: PrismaClient,
  userId: string,
  jobId: string
): Promise<TryOnJobResponse> {
  const existingJob = await findUserTryOnJobById(prisma, userId, jobId);

  if (existingJob === null) {
    throw new TryOnServiceError("TRY_ON_JOB_NOT_FOUND", 404, "Try-on job was not found.");
  }

  const job = await updateTryOnJobStatus(prisma, userId, jobId, cancellableStatuses, {
    status: PrismaTryOnJobStatus.CANCELLED,
    cancelledAt: new Date(),
    completedAt: new Date()
  });

  if (job === null) {
    throw new TryOnServiceError(
      "TRY_ON_JOB_NOT_CANCELLABLE",
      409,
      "Try-on job cannot be cancelled from its current state."
    );
  }

  return {
    data: toTryOnJob(job)
  };
}

export async function deleteTryOnJob(
  prisma: PrismaClient,
  userId: string,
  jobId: string
): Promise<DeleteTryOnJobResponse> {
  const existingJob = await findUserTryOnJobById(prisma, userId, jobId);

  if (existingJob === null) {
    throw new TryOnServiceError("TRY_ON_JOB_NOT_FOUND", 404, "Try-on job was not found.");
  }

  const expiredJob = await expireTryOnJob(prisma, userId, jobId);

  if (expiredJob === null) {
    throw new TryOnServiceError("TRY_ON_JOB_NOT_FOUND", 404, "Try-on job was not found.");
  }

  return {
    data: {
      success: true
    }
  };
}

async function requireTryOnJobForLifecycle(
  prisma: PrismaClient,
  jobId: string
): Promise<TryOnJobRecord> {
  const job = await findTryOnJobById(prisma, jobId);

  if (job === null) {
    throw new TryOnServiceError("TRY_ON_JOB_NOT_FOUND", 404, "Try-on job was not found.");
  }

  return job;
}

function lifecycleTransitionConflict(): TryOnServiceError {
  return new TryOnServiceError(
    "TRY_ON_JOB_TRANSITION_CONFLICT",
    409,
    "Try-on job cannot move from its current state."
  );
}

export async function markTryOnJobValidating(
  prisma: PrismaClient,
  jobId: string
): Promise<TryOnJobResponse> {
  await requireTryOnJobForLifecycle(prisma, jobId);

  const job = await transitionTryOnJobStatus(prisma, jobId, [PrismaTryOnJobStatus.QUEUED], {
    status: PrismaTryOnJobStatus.VALIDATING
  });

  if (job === null) {
    throw lifecycleTransitionConflict();
  }

  return {
    data: toTryOnJob(job)
  };
}

export async function markTryOnJobProcessing(
  prisma: PrismaClient,
  jobId: string
): Promise<TryOnJobResponse> {
  await requireTryOnJobForLifecycle(prisma, jobId);

  const job = await transitionTryOnJobStatus(prisma, jobId, [PrismaTryOnJobStatus.VALIDATING], {
    status: PrismaTryOnJobStatus.PROCESSING,
    processingStartedAt: new Date(),
    attemptCount: {
      increment: 1
    }
  });

  if (job === null) {
    throw lifecycleTransitionConflict();
  }

  return {
    data: toTryOnJob(job)
  };
}

export async function markTryOnJobSucceeded(
  prisma: PrismaClient,
  jobId: string,
  input: CompleteTryOnJobInput
): Promise<TryOnJobResponse> {
  await requireTryOnJobForLifecycle(prisma, jobId);

  const job = await completeTryOnJobWithResult(prisma, {
    jobId,
    statuses: [PrismaTryOnJobStatus.PROCESSING],
    storageKey: input.storageKey,
    mediaType: input.mediaType,
    provider: input.provider,
    ...(input.providerVersion === undefined ? {} : { providerVersion: input.providerVersion }),
    ...(input.modelVersion === undefined ? {} : { modelVersion: input.modelVersion }),
    ...(input.width === undefined ? {} : { width: input.width }),
    ...(input.height === undefined ? {} : { height: input.height }),
    ...(input.fileSize === undefined ? {} : { fileSize: input.fileSize }),
    ...(input.expiresAt === undefined ? {} : { expiresAt: input.expiresAt })
  });

  if (job === null) {
    throw lifecycleTransitionConflict();
  }

  return {
    data: toTryOnJob(job)
  };
}

export async function markTryOnJobFailed(
  prisma: PrismaClient,
  jobId: string,
  input: FailTryOnJobInput
): Promise<TryOnJobResponse> {
  await requireTryOnJobForLifecycle(prisma, jobId);

  const job = await transitionTryOnJobStatus(
    prisma,
    jobId,
    [PrismaTryOnJobStatus.QUEUED, PrismaTryOnJobStatus.VALIDATING, PrismaTryOnJobStatus.PROCESSING],
    {
      status: PrismaTryOnJobStatus.FAILED,
      failureCode: input.code,
      failureMessage: input.message,
      completedAt: new Date()
    }
  );

  if (job === null) {
    throw lifecycleTransitionConflict();
  }

  return {
    data: toTryOnJob(job)
  };
}

export async function markTryOnJobCancelled(
  prisma: PrismaClient,
  jobId: string
): Promise<TryOnJobResponse> {
  await requireTryOnJobForLifecycle(prisma, jobId);

  const now = new Date();
  const job = await transitionTryOnJobStatus(
    prisma,
    jobId,
    [PrismaTryOnJobStatus.QUEUED, PrismaTryOnJobStatus.VALIDATING, PrismaTryOnJobStatus.PROCESSING],
    {
      status: PrismaTryOnJobStatus.CANCELLED,
      cancelledAt: now,
      completedAt: now
    }
  );

  if (job === null) {
    throw lifecycleTransitionConflict();
  }

  return {
    data: toTryOnJob(job)
  };
}

export async function heartbeatTryOnJob(
  prisma: PrismaClient,
  jobId: string
): Promise<TryOnJobResponse> {
  await requireTryOnJobForLifecycle(prisma, jobId);

  const job = await touchTryOnJobHeartbeat(prisma, jobId, [
    PrismaTryOnJobStatus.VALIDATING,
    PrismaTryOnJobStatus.PROCESSING
  ]);

  if (job === null) {
    throw lifecycleTransitionConflict();
  }

  return {
    data: toTryOnJob(job)
  };
}
