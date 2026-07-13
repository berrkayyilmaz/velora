export type TryOnQueueItemStatus = "queued" | "claimed" | "completed" | "failed" | "cancelled";

export type TryOnQueueError = {
  code: string;
  message: string;
  retryable: boolean;
};

export type TryOnQueueMetadata = Record<string, string | number | boolean | null>;

export type TryOnQueueItem = {
  jobId: string;
  status: TryOnQueueItemStatus;
  attempts: number;
  maxAttempts: number;
  priority: number;
  enqueuedAt: Date;
  availableAt: Date;
  claimedAt: Date | null;
  heartbeatAt: Date | null;
  leaseExpiresAt: Date | null;
  completedAt: Date | null;
  failedAt: Date | null;
  cancelledAt: Date | null;
  workerId: string | null;
  leaseId: string | null;
  lastError: TryOnQueueError | null;
  metadata: TryOnQueueMetadata;
};

export type TryOnQueueClaim = TryOnQueueItem & {
  status: "claimed";
  claimedAt: Date;
  heartbeatAt: Date;
  leaseExpiresAt: Date;
  workerId: string;
  leaseId: string;
};

export type TryOnQueueEnqueueInput = {
  jobId: string;
  maxAttempts?: number;
  priority?: number;
  availableAt?: Date;
  metadata?: TryOnQueueMetadata;
};

export type TryOnQueueClaimOptions = {
  workerId: string;
  leaseMs?: number;
  now?: Date;
};

export type TryOnQueueLeaseInput = {
  jobId: string;
  leaseId: string;
  now?: Date;
};

export type TryOnQueueHeartbeatInput = TryOnQueueLeaseInput & {
  leaseMs?: number;
};

export type TryOnQueueCompleteInput = TryOnQueueLeaseInput;

export type TryOnQueueFailInput = TryOnQueueLeaseInput & {
  error: TryOnQueueError;
  retryAt?: Date;
};

export type TryOnQueueCancelInput = {
  jobId: string;
  now?: Date;
};

export type TryOnQueueFailResult = {
  accepted: boolean;
  terminal: boolean;
  item: TryOnQueueItem | null;
};

export type TryOnQueueMutationResult = {
  accepted: boolean;
  item: TryOnQueueItem | null;
};

export type TryOnQueueCancelResult = TryOnQueueMutationResult & {
  reason: "cancelled" | "not_found" | "already_terminal";
};

export type TryOnJobQueue = {
  enqueue(input: TryOnQueueEnqueueInput): Promise<TryOnQueueItem>;
  claim(options: TryOnQueueClaimOptions): Promise<TryOnQueueClaim | null>;
  heartbeat(input: TryOnQueueHeartbeatInput): Promise<TryOnQueueClaim | null>;
  complete(input: TryOnQueueCompleteInput): Promise<TryOnQueueMutationResult>;
  fail(input: TryOnQueueFailInput): Promise<TryOnQueueFailResult>;
  cancel(input: TryOnQueueCancelInput): Promise<TryOnQueueCancelResult>;
};
