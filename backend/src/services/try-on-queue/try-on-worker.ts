import type {
  TryOnJobQueue,
  TryOnQueueClaim,
  TryOnQueueClaimOptions,
  TryOnQueueError
} from "./try-on-queue.js";

export type TryOnWorkerProcessResult =
  | {
      status: "completed";
    }
  | {
      status: "failed";
      error: TryOnQueueError;
      retryAt?: Date;
    }
  | {
      status: "cancelled";
    };

export type TryOnWorkerProcessor = (claim: TryOnQueueClaim) => Promise<TryOnWorkerProcessResult>;

export type TryOnWorkerIterationResult =
  | {
      status: "idle";
    }
  | {
      status: "completed" | "failed" | "cancelled";
      jobId: string;
    };

function normalizeUnknownError(error: unknown): TryOnQueueError {
  if (error instanceof Error) {
    return {
      code: "worker_unhandled_error",
      message: error.message,
      retryable: true
    };
  }

  return {
    code: "worker_unhandled_error",
    message: "Worker failed with an unknown error.",
    retryable: true
  };
}

export async function runTryOnWorkerIteration(
  queue: TryOnJobQueue,
  processor: TryOnWorkerProcessor,
  claimOptions: TryOnQueueClaimOptions
): Promise<TryOnWorkerIterationResult> {
  const claim = await queue.claim(claimOptions);

  if (claim === null) {
    return { status: "idle" };
  }

  try {
    const result = await processor(claim);

    if (result.status === "completed") {
      await queue.complete({
        jobId: claim.jobId,
        leaseId: claim.leaseId
      });

      return {
        status: "completed",
        jobId: claim.jobId
      };
    }

    if (result.status === "cancelled") {
      await queue.cancel({
        jobId: claim.jobId
      });

      return {
        status: "cancelled",
        jobId: claim.jobId
      };
    }

    await queue.fail({
      jobId: claim.jobId,
      leaseId: claim.leaseId,
      error: result.error,
      retryAt: result.retryAt
    });

    return {
      status: "failed",
      jobId: claim.jobId
    };
  } catch (error) {
    await queue.fail({
      jobId: claim.jobId,
      leaseId: claim.leaseId,
      error: normalizeUnknownError(error)
    });

    return {
      status: "failed",
      jobId: claim.jobId
    };
  }
}
