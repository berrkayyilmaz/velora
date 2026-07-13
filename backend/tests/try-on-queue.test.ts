import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { LocalTryOnJobQueue } from "../src/services/try-on-queue/local-try-on-queue.js";
import { runTryOnWorkerIteration } from "../src/services/try-on-queue/try-on-worker.js";
import type { TryOnQueueError } from "../src/services/try-on-queue/try-on-queue.js";

const retryableError: TryOnQueueError = {
  code: "temporary_worker_failure",
  message: "Temporary worker failure.",
  retryable: true
};

void describe("LocalTryOnJobQueue", () => {
  void it("claims queued jobs in FIFO order for equal priority", async () => {
    const queue = new LocalTryOnJobQueue();

    await queue.enqueue({ jobId: "job-1" });
    await queue.enqueue({ jobId: "job-2" });

    const firstClaim = await queue.claim({ workerId: "worker-a" });
    const secondClaim = await queue.claim({ workerId: "worker-a" });

    assert.equal(firstClaim?.jobId, "job-1");
    assert.equal(secondClaim?.jobId, "job-2");
  });

  void it("prevents cancelled jobs from being claimed", async () => {
    const queue = new LocalTryOnJobQueue();

    await queue.enqueue({ jobId: "job-cancelled" });
    const cancelResult = await queue.cancel({ jobId: "job-cancelled" });
    const claim = await queue.claim({ workerId: "worker-a" });

    assert.equal(cancelResult.accepted, true);
    assert.equal(cancelResult.reason, "cancelled");
    assert.equal(claim, null);
  });

  void it("requeues retryable failures until max attempts are exhausted", async () => {
    const queue = new LocalTryOnJobQueue();

    await queue.enqueue({ jobId: "job-retry", maxAttempts: 2 });

    const firstClaim = await queue.claim({ workerId: "worker-a" });
    assert.ok(firstClaim);

    const firstFailure = await queue.fail({
      jobId: firstClaim.jobId,
      leaseId: firstClaim.leaseId,
      error: retryableError
    });

    assert.equal(firstFailure.accepted, true);
    assert.equal(firstFailure.terminal, false);
    assert.equal(firstFailure.item?.status, "queued");

    const secondClaim = await queue.claim({ workerId: "worker-a" });
    assert.ok(secondClaim);
    assert.equal(secondClaim.attempts, 2);

    const secondFailure = await queue.fail({
      jobId: secondClaim.jobId,
      leaseId: secondClaim.leaseId,
      error: retryableError
    });

    assert.equal(secondFailure.accepted, true);
    assert.equal(secondFailure.terminal, true);
    assert.equal(secondFailure.item?.status, "failed");
  });

  void it("releases stale claims when a heartbeat lease expires", async () => {
    const queue = new LocalTryOnJobQueue();
    const start = new Date("2026-01-01T00:00:00.000Z");
    const afterLeaseExpiry = new Date(start.getTime() + 20);

    await queue.enqueue({ jobId: "job-stale", availableAt: start });

    const staleClaim = await queue.claim({
      workerId: "worker-a",
      leaseMs: 10,
      now: start
    });
    assert.ok(staleClaim);

    const reclaimed = await queue.claim({
      workerId: "worker-b",
      leaseMs: 10,
      now: afterLeaseExpiry
    });

    assert.ok(reclaimed);
    assert.equal(reclaimed.jobId, "job-stale");
    assert.equal(reclaimed.workerId, "worker-b");
    assert.equal(reclaimed.attempts, 2);
  });

  void it("renews a heartbeat lease for the active claimant", async () => {
    const queue = new LocalTryOnJobQueue();
    const start = new Date("2026-01-01T00:00:00.000Z");
    const heartbeatAt = new Date(start.getTime() + 5);

    await queue.enqueue({ jobId: "job-heartbeat", availableAt: start });

    const claim = await queue.claim({
      workerId: "worker-a",
      leaseMs: 10,
      now: start
    });
    assert.ok(claim);

    const heartbeat = await queue.heartbeat({
      jobId: claim.jobId,
      leaseId: claim.leaseId,
      leaseMs: 30,
      now: heartbeatAt
    });

    assert.ok(heartbeat);
    assert.equal(heartbeat.heartbeatAt.toISOString(), heartbeatAt.toISOString());
    assert.equal(
      heartbeat.leaseExpiresAt.toISOString(),
      new Date(heartbeatAt.getTime() + 30).toISOString()
    );
  });

  void it("runs one worker iteration without auto-starting a worker loop", async () => {
    const queue = new LocalTryOnJobQueue();

    await queue.enqueue({ jobId: "job-worker" });

    const result = await runTryOnWorkerIteration(
      queue,
      () =>
        Promise.resolve({
          status: "completed"
        }),
      {
        workerId: "worker-a"
      }
    );

    assert.deepEqual(result, {
      status: "completed",
      jobId: "job-worker"
    });

    const nextResult = await runTryOnWorkerIteration(
      queue,
      () =>
        Promise.resolve({
          status: "completed"
        }),
      {
        workerId: "worker-a"
      }
    );

    assert.deepEqual(nextResult, {
      status: "idle"
    });
  });
});
