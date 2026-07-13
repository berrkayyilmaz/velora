import { randomUUID } from "node:crypto";

import type {
  TryOnJobQueue,
  TryOnQueueCancelInput,
  TryOnQueueCancelResult,
  TryOnQueueClaim,
  TryOnQueueClaimOptions,
  TryOnQueueCompleteInput,
  TryOnQueueEnqueueInput,
  TryOnQueueFailInput,
  TryOnQueueFailResult,
  TryOnQueueHeartbeatInput,
  TryOnQueueItem,
  TryOnQueueMutationResult
} from "./try-on-queue.js";

const DEFAULT_MAX_ATTEMPTS = 3;
const DEFAULT_PRIORITY = 0;
const DEFAULT_LEASE_MS = 60_000;

type LocalTryOnQueueItem = TryOnQueueItem & {
  sequence: number;
};

function cloneItem(item: LocalTryOnQueueItem): TryOnQueueItem {
  return {
    jobId: item.jobId,
    status: item.status,
    attempts: item.attempts,
    maxAttempts: item.maxAttempts,
    priority: item.priority,
    enqueuedAt: new Date(item.enqueuedAt),
    availableAt: new Date(item.availableAt),
    claimedAt: item.claimedAt === null ? null : new Date(item.claimedAt),
    heartbeatAt: item.heartbeatAt === null ? null : new Date(item.heartbeatAt),
    leaseExpiresAt: item.leaseExpiresAt === null ? null : new Date(item.leaseExpiresAt),
    completedAt: item.completedAt === null ? null : new Date(item.completedAt),
    failedAt: item.failedAt === null ? null : new Date(item.failedAt),
    cancelledAt: item.cancelledAt === null ? null : new Date(item.cancelledAt),
    workerId: item.workerId,
    leaseId: item.leaseId,
    lastError: item.lastError === null ? null : { ...item.lastError },
    metadata: { ...item.metadata }
  };
}

function cloneClaim(item: LocalTryOnQueueItem): TryOnQueueClaim {
  if (
    item.status !== "claimed" ||
    item.claimedAt === null ||
    item.heartbeatAt === null ||
    item.leaseExpiresAt === null ||
    item.workerId === null ||
    item.leaseId === null
  ) {
    throw new Error("Queue item is not currently claimed.");
  }

  return {
    ...cloneItem(item),
    status: "claimed",
    claimedAt: new Date(item.claimedAt),
    heartbeatAt: new Date(item.heartbeatAt),
    leaseExpiresAt: new Date(item.leaseExpiresAt),
    workerId: item.workerId,
    leaseId: item.leaseId
  };
}

function isTerminal(status: TryOnQueueItem["status"]): boolean {
  return status === "completed" || status === "failed" || status === "cancelled";
}

export class LocalTryOnJobQueue implements TryOnJobQueue {
  private readonly items = new Map<string, LocalTryOnQueueItem>();
  private sequence = 0;

  enqueue(input: TryOnQueueEnqueueInput): Promise<TryOnQueueItem> {
    const existingItem = this.items.get(input.jobId);

    if (existingItem !== undefined && !isTerminal(existingItem.status)) {
      return Promise.resolve(cloneItem(existingItem));
    }

    const now = new Date();
    const item: LocalTryOnQueueItem = {
      jobId: input.jobId,
      status: "queued",
      attempts: 0,
      maxAttempts: input.maxAttempts ?? DEFAULT_MAX_ATTEMPTS,
      priority: input.priority ?? DEFAULT_PRIORITY,
      enqueuedAt: now,
      availableAt: input.availableAt ?? now,
      claimedAt: null,
      heartbeatAt: null,
      leaseExpiresAt: null,
      completedAt: null,
      failedAt: null,
      cancelledAt: null,
      workerId: null,
      leaseId: null,
      lastError: null,
      metadata: input.metadata ?? {},
      sequence: this.sequence
    };

    this.sequence += 1;
    this.items.set(input.jobId, item);

    return Promise.resolve(cloneItem(item));
  }

  claim(options: TryOnQueueClaimOptions): Promise<TryOnQueueClaim | null> {
    const now = options.now ?? new Date();
    const leaseMs = options.leaseMs ?? DEFAULT_LEASE_MS;

    this.releaseExpiredClaims(now);

    const claimableItem = [...this.items.values()]
      .filter((item) => item.status === "queued" && item.availableAt.getTime() <= now.getTime())
      .sort((left, right) => {
        if (left.priority !== right.priority) {
          return right.priority - left.priority;
        }

        return left.sequence - right.sequence;
      })[0];

    if (claimableItem === undefined) {
      return Promise.resolve(null);
    }

    claimableItem.status = "claimed";
    claimableItem.attempts += 1;
    claimableItem.claimedAt = now;
    claimableItem.heartbeatAt = now;
    claimableItem.leaseExpiresAt = new Date(now.getTime() + leaseMs);
    claimableItem.workerId = options.workerId;
    claimableItem.leaseId = randomUUID();

    return Promise.resolve(cloneClaim(claimableItem));
  }

  heartbeat(input: TryOnQueueHeartbeatInput): Promise<TryOnQueueClaim | null> {
    const item = this.findClaimedItem(input.jobId, input.leaseId);

    if (item === null) {
      return Promise.resolve(null);
    }

    const now = input.now ?? new Date();
    const leaseMs = input.leaseMs ?? DEFAULT_LEASE_MS;

    item.heartbeatAt = now;
    item.leaseExpiresAt = new Date(now.getTime() + leaseMs);

    return Promise.resolve(cloneClaim(item));
  }

  complete(input: TryOnQueueCompleteInput): Promise<TryOnQueueMutationResult> {
    const item = this.findClaimedItem(input.jobId, input.leaseId);

    if (item === null) {
      return Promise.resolve({ accepted: false, item: null });
    }

    item.status = "completed";
    item.completedAt = input.now ?? new Date();
    this.clearClaim(item);

    return Promise.resolve({
      accepted: true,
      item: cloneItem(item)
    });
  }

  fail(input: TryOnQueueFailInput): Promise<TryOnQueueFailResult> {
    const item = this.findClaimedItem(input.jobId, input.leaseId);

    if (item === null) {
      return Promise.resolve({
        accepted: false,
        terminal: false,
        item: null
      });
    }

    const now = input.now ?? new Date();
    item.lastError = { ...input.error };

    if (input.error.retryable && item.attempts < item.maxAttempts) {
      item.status = "queued";
      item.availableAt = input.retryAt ?? now;
      this.clearClaim(item);

      return Promise.resolve({
        accepted: true,
        terminal: false,
        item: cloneItem(item)
      });
    }

    item.status = "failed";
    item.failedAt = now;
    this.clearClaim(item);

    return Promise.resolve({
      accepted: true,
      terminal: true,
      item: cloneItem(item)
    });
  }

  cancel(input: TryOnQueueCancelInput): Promise<TryOnQueueCancelResult> {
    const item = this.items.get(input.jobId);

    if (item === undefined) {
      return Promise.resolve({
        accepted: false,
        reason: "not_found",
        item: null
      });
    }

    if (isTerminal(item.status)) {
      return Promise.resolve({
        accepted: false,
        reason: "already_terminal",
        item: cloneItem(item)
      });
    }

    item.status = "cancelled";
    item.cancelledAt = input.now ?? new Date();
    this.clearClaim(item);

    return Promise.resolve({
      accepted: true,
      reason: "cancelled",
      item: cloneItem(item)
    });
  }

  private findClaimedItem(jobId: string, leaseId: string): LocalTryOnQueueItem | null {
    const item = this.items.get(jobId);

    if (item === undefined || item.status !== "claimed" || item.leaseId !== leaseId) {
      return null;
    }

    return item;
  }

  private releaseExpiredClaims(now: Date): void {
    for (const item of this.items.values()) {
      if (
        item.status === "claimed" &&
        item.leaseExpiresAt !== null &&
        item.leaseExpiresAt.getTime() <= now.getTime()
      ) {
        item.status = "queued";
        item.availableAt = now;
        this.clearClaim(item);
      }
    }
  }

  private clearClaim(item: LocalTryOnQueueItem): void {
    item.claimedAt = null;
    item.heartbeatAt = null;
    item.leaseExpiresAt = null;
    item.workerId = null;
    item.leaseId = null;
  }
}
