import { access } from "node:fs/promises";
import path from "node:path";

import { TryOnJobStatus as PrismaTryOnJobStatus } from "@prisma/client";
import type { PrismaClient } from "@prisma/client";

import {
  completeTryOnJobWithResult,
  findTryOnJobById,
  PrismaTryOnJobStatus as RepositoryTryOnJobStatus,
  transitionTryOnJobStatus,
  type TryOnJobRecord
} from "../../repositories/try-on.repository.js";
import type {
  TryOnWorkerProcessResult,
  TryOnWorkerProcessor
} from "../try-on-queue/try-on-worker.js";
import type { TryOnQueueClaim, TryOnQueueError } from "../try-on-queue/try-on-queue.js";
import type {
  TryOnInferenceExecutionResult,
  TryOnInferenceExecutor,
  TryOnInferenceRequest
} from "./try-on-executor.js";

const TERMINAL_STATUSES = new Set<PrismaTryOnJobStatus>([
  PrismaTryOnJobStatus.SUCCEEDED,
  PrismaTryOnJobStatus.FAILED,
  PrismaTryOnJobStatus.CANCELLED,
  PrismaTryOnJobStatus.EXPIRED
]);

export type TryOnExecutionSuccessInput = {
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

export type TryOnExecutionFailureInput = {
  code: string;
  message: string;
};

export type TryOnExecutionLifecycle = {
  getJob(jobId: string): Promise<TryOnJobRecord | null>;
  markValidating(jobId: string): Promise<TryOnJobRecord | null>;
  markProcessing(jobId: string): Promise<TryOnJobRecord | null>;
  markSucceeded(jobId: string, input: TryOnExecutionSuccessInput): Promise<TryOnJobRecord | null>;
  markFailed(jobId: string, input: TryOnExecutionFailureInput): Promise<TryOnJobRecord | null>;
};

export type TryOnExecutionBridgeOptions = {
  outputDirectory: string;
  outputMediaType: string;
  provider: string;
  providerVersion?: string;
  modelVersion?: string;
};

function buildOutputArtifactPath(outputDirectory: string, jobId: string): string {
  return path.join(outputDirectory, `${jobId}.png`);
}

export function mapTryOnJobToInferenceRequest(
  job: TryOnJobRecord,
  outputDirectory: string
): TryOnInferenceRequest {
  if (job.personImageStorageKey === null) {
    throw new Error("Try-on job is missing a person image asset.");
  }

  if (job.productId !== null) {
    return {
      jobId: job.id,
      personImageAssetId: job.personImageStorageKey,
      garmentSource: {
        type: "catalog_product",
        productId: job.productId
      },
      outfitId: job.outfitId,
      outputArtifactPath: buildOutputArtifactPath(outputDirectory, job.id)
    };
  }

  if (job.wardrobeItemId !== null) {
    return {
      jobId: job.id,
      personImageAssetId: job.personImageStorageKey,
      garmentSource: {
        type: "wardrobe_item",
        wardrobeItemId: job.wardrobeItemId
      },
      outfitId: job.outfitId,
      outputArtifactPath: buildOutputArtifactPath(outputDirectory, job.id)
    };
  }

  throw new Error("Try-on job is missing a garment source.");
}

export function createPrismaTryOnExecutionLifecycle(prisma: PrismaClient): TryOnExecutionLifecycle {
  return {
    getJob: (jobId) => findTryOnJobById(prisma, jobId),
    markValidating: (jobId) =>
      transitionTryOnJobStatus(prisma, jobId, [RepositoryTryOnJobStatus.QUEUED], {
        status: RepositoryTryOnJobStatus.VALIDATING
      }),
    markProcessing: (jobId) =>
      transitionTryOnJobStatus(prisma, jobId, [RepositoryTryOnJobStatus.VALIDATING], {
        status: RepositoryTryOnJobStatus.PROCESSING,
        processingStartedAt: new Date(),
        attemptCount: {
          increment: 1
        }
      }),
    markSucceeded: (jobId, input) =>
      completeTryOnJobWithResult(prisma, {
        jobId,
        statuses: [RepositoryTryOnJobStatus.PROCESSING],
        storageKey: input.storageKey,
        mediaType: input.mediaType,
        provider: input.provider,
        ...(input.providerVersion === undefined ? {} : { providerVersion: input.providerVersion }),
        ...(input.modelVersion === undefined ? {} : { modelVersion: input.modelVersion }),
        ...(input.width === undefined ? {} : { width: input.width }),
        ...(input.height === undefined ? {} : { height: input.height }),
        ...(input.fileSize === undefined ? {} : { fileSize: input.fileSize }),
        ...(input.expiresAt === undefined ? {} : { expiresAt: input.expiresAt })
      }),
    markFailed: (jobId, input) =>
      transitionTryOnJobStatus(
        prisma,
        jobId,
        [
          RepositoryTryOnJobStatus.QUEUED,
          RepositoryTryOnJobStatus.VALIDATING,
          RepositoryTryOnJobStatus.PROCESSING
        ],
        {
          status: RepositoryTryOnJobStatus.FAILED,
          failureCode: input.code,
          failureMessage: input.message,
          completedAt: new Date()
        }
      )
  };
}

function normalizeExecutionFailure(result: TryOnInferenceExecutionResult): TryOnQueueError {
  if (result.timedOut) {
    return {
      code: "try_on_executor_timeout",
      message: "Try-on execution timed out.",
      retryable: false
    };
  }

  return {
    code: result.errorCode ?? "try_on_executor_failed",
    message: result.stderr.trim() || `Try-on execution failed with exit code ${result.exitCode}.`,
    retryable: false
  };
}

async function outputArtifactExists(outputArtifactPath: string): Promise<boolean> {
  try {
    await access(outputArtifactPath);
    return true;
  } catch {
    return false;
  }
}

async function markBridgeFailure(
  lifecycle: TryOnExecutionLifecycle,
  jobId: string,
  error: TryOnQueueError
): Promise<TryOnWorkerProcessResult> {
  await lifecycle.markFailed(jobId, {
    code: error.code,
    message: error.message
  });

  return {
    status: "failed",
    error
  };
}

export async function executeClaimedTryOnJob(
  claim: TryOnQueueClaim,
  lifecycle: TryOnExecutionLifecycle,
  executor: TryOnInferenceExecutor,
  options: TryOnExecutionBridgeOptions
): Promise<TryOnWorkerProcessResult> {
  const initialJob = await lifecycle.getJob(claim.jobId);

  if (initialJob === null) {
    return {
      status: "failed",
      error: {
        code: "try_on_job_not_found",
        message: "Try-on job was not found.",
        retryable: false
      }
    };
  }

  if (initialJob.status === PrismaTryOnJobStatus.CANCELLED) {
    return {
      status: "cancelled"
    };
  }

  if (TERMINAL_STATUSES.has(initialJob.status)) {
    return {
      status: "failed",
      error: {
        code: "try_on_job_terminal",
        message: "Try-on job is already in a terminal state.",
        retryable: false
      }
    };
  }

  try {
    await lifecycle.markValidating(claim.jobId);
    const processingJob = await lifecycle.markProcessing(claim.jobId);

    if (processingJob === null) {
      return markBridgeFailure(lifecycle, claim.jobId, {
        code: "try_on_job_transition_failed",
        message: "Try-on job could not enter processing state.",
        retryable: false
      });
    }

    const request = mapTryOnJobToInferenceRequest(processingJob, options.outputDirectory);
    const executionResult = await executor.execute(request);

    if (!executionResult.success) {
      return markBridgeFailure(lifecycle, claim.jobId, normalizeExecutionFailure(executionResult));
    }

    const hasOutputArtifact = await outputArtifactExists(executionResult.outputArtifactPath);

    if (!hasOutputArtifact) {
      return markBridgeFailure(lifecycle, claim.jobId, {
        code: "try_on_output_missing",
        message: "Try-on execution completed without an output artifact.",
        retryable: false
      });
    }

    await lifecycle.markSucceeded(claim.jobId, {
      storageKey: executionResult.outputArtifactPath,
      mediaType: options.outputMediaType,
      provider: options.provider,
      ...(options.providerVersion === undefined
        ? {}
        : { providerVersion: options.providerVersion }),
      ...(executionResult.modelVersion === undefined && options.modelVersion === undefined
        ? {}
        : { modelVersion: executionResult.modelVersion ?? options.modelVersion }),
      ...(executionResult.width === undefined ? {} : { width: executionResult.width }),
      ...(executionResult.height === undefined ? {} : { height: executionResult.height }),
      ...(executionResult.fileSize === undefined ? {} : { fileSize: executionResult.fileSize })
    });

    return {
      status: "completed"
    };
  } catch (error) {
    const normalizedError: TryOnQueueError =
      error instanceof Error
        ? {
            code: "try_on_bridge_failed",
            message: error.message,
            retryable: false
          }
        : {
            code: "try_on_bridge_failed",
            message: "Try-on bridge failed with an unknown error.",
            retryable: false
          };

    return markBridgeFailure(lifecycle, claim.jobId, normalizedError);
  }
}

export function createTryOnExecutionProcessor(
  lifecycle: TryOnExecutionLifecycle,
  executor: TryOnInferenceExecutor,
  options: TryOnExecutionBridgeOptions
): TryOnWorkerProcessor {
  return (claim) => executeClaimedTryOnJob(claim, lifecycle, executor, options);
}
