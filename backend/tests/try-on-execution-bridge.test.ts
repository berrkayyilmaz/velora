import { access, mkdtemp } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { TryOnJobStatus, TryOnResultStatus } from "@prisma/client";

import { LocalTryOnJobQueue } from "../src/services/try-on-queue/local-try-on-queue.js";
import { runTryOnWorkerIteration } from "../src/services/try-on-queue/try-on-worker.js";
import { LocalProcessTryOnExecutor } from "../src/services/try-on-executor/local-process-try-on-executor.js";
import {
  createTryOnExecutionProcessor,
  type TryOnExecutionFailureInput,
  type TryOnExecutionLifecycle,
  type TryOnExecutionSuccessInput
} from "../src/services/try-on-executor/try-on-execution-bridge.js";
import type { TryOnJobRecord } from "../src/repositories/try-on.repository.js";

const currentFilePath = fileURLToPath(import.meta.url);
const currentDirectory = path.dirname(currentFilePath);
const fakeExecutorPath = path.join(currentDirectory, "fixtures", "fake-try-on-executor.mjs");

function createTryOnJobRecord(overrides: Partial<TryOnJobRecord> = {}): TryOnJobRecord {
  const now = new Date("2026-01-01T00:00:00.000Z");

  return {
    id: "10000000-0000-4000-8000-000000000001",
    userId: "10000000-0000-4000-8000-000000000002",
    consentId: "10000000-0000-4000-8000-000000000003",
    personImageStorageKey: "try-on/source/person.png",
    productId: "10000000-0000-4000-8000-000000000004",
    wardrobeItemId: null,
    outfitId: null,
    status: TryOnJobStatus.QUEUED,
    provider: null,
    providerVersion: null,
    modelVersion: null,
    idempotencyKey: null,
    attemptCount: 0,
    maxAttempts: 3,
    failureCode: null,
    failureMessage: null,
    processingStartedAt: null,
    completedAt: null,
    cancelledAt: null,
    expiresAt: null,
    createdAt: now,
    updatedAt: now,
    result: null,
    ...overrides
  };
}

class FakeTryOnExecutionLifecycle implements TryOnExecutionLifecycle {
  succeededInput: TryOnExecutionSuccessInput | null = null;
  failedInput: TryOnExecutionFailureInput | null = null;

  constructor(private job: TryOnJobRecord | null) {}

  get currentJob(): TryOnJobRecord | null {
    return this.job;
  }

  getJob(): Promise<TryOnJobRecord | null> {
    return Promise.resolve(this.job);
  }

  markValidating(): Promise<TryOnJobRecord | null> {
    if (this.job === null || this.job.status !== TryOnJobStatus.QUEUED) {
      return Promise.resolve(null);
    }

    this.job = {
      ...this.job,
      status: TryOnJobStatus.VALIDATING
    };

    return Promise.resolve(this.job);
  }

  markProcessing(): Promise<TryOnJobRecord | null> {
    if (this.job === null || this.job.status !== TryOnJobStatus.VALIDATING) {
      return Promise.resolve(null);
    }

    this.job = {
      ...this.job,
      status: TryOnJobStatus.PROCESSING,
      processingStartedAt: new Date(),
      attemptCount: this.job.attemptCount + 1
    };

    return Promise.resolve(this.job);
  }

  markSucceeded(_jobId: string, input: TryOnExecutionSuccessInput): Promise<TryOnJobRecord | null> {
    if (this.job === null || this.job.status !== TryOnJobStatus.PROCESSING) {
      return Promise.resolve(null);
    }

    this.succeededInput = input;
    const now = new Date();

    this.job = {
      ...this.job,
      status: TryOnJobStatus.SUCCEEDED,
      provider: input.provider,
      providerVersion: input.providerVersion ?? null,
      modelVersion: input.modelVersion ?? null,
      completedAt: now,
      result: {
        id: "10000000-0000-4000-8000-000000000005",
        jobId: this.job.id,
        mediaType: input.mediaType,
        width: input.width ?? null,
        height: input.height ?? null,
        status: TryOnResultStatus.READY,
        expiresAt: input.expiresAt ?? null,
        createdAt: now,
        deletedAt: null
      }
    };

    return Promise.resolve(this.job);
  }

  markFailed(_jobId: string, input: TryOnExecutionFailureInput): Promise<TryOnJobRecord | null> {
    if (this.job === null) {
      return Promise.resolve(null);
    }

    this.failedInput = input;
    this.job = {
      ...this.job,
      status: TryOnJobStatus.FAILED,
      failureCode: input.code,
      failureMessage: input.message,
      completedAt: new Date()
    };

    return Promise.resolve(this.job);
  }

  markCancelled(): Promise<TryOnJobRecord | null> {
    if (this.job === null) {
      return Promise.resolve(null);
    }

    this.job = {
      ...this.job,
      status: TryOnJobStatus.CANCELLED,
      cancelledAt: new Date(),
      completedAt: new Date()
    };

    return Promise.resolve(this.job);
  }
}

function createExecutor(mode: string, timeoutMs = 2_000): LocalProcessTryOnExecutor {
  return new LocalProcessTryOnExecutor({
    command: process.execPath,
    args: [
      fakeExecutorPath,
      "--mode",
      mode,
      "--job",
      "{jobId}",
      "--person",
      "{personImageAssetId}",
      "--garment-source",
      "{garmentSourceType}",
      "--product",
      "{productId}",
      "--wardrobe-item",
      "{wardrobeItemId}",
      "--output",
      "{outputArtifactPath}"
    ],
    timeoutMs
  });
}

async function createOutputDirectory(): Promise<string> {
  return mkdtemp(path.join(os.tmpdir(), "velora-try-on-bridge-"));
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function runBridgeTest(
  lifecycle: FakeTryOnExecutionLifecycle,
  mode: string,
  timeoutMs = 2_000
) {
  const queue = new LocalTryOnJobQueue();
  const outputDirectory = await createOutputDirectory();

  await queue.enqueue({ jobId: "10000000-0000-4000-8000-000000000001" });

  const result = await runTryOnWorkerIteration(
    queue,
    createTryOnExecutionProcessor(lifecycle, createExecutor(mode, timeoutMs), {
      outputDirectory,
      outputMediaType: "image/png",
      provider: "local-process-test",
      providerVersion: "test",
      modelVersion: "fake"
    }),
    {
      workerId: "worker-test"
    }
  );

  return {
    result,
    outputPath: path.join(outputDirectory, "10000000-0000-4000-8000-000000000001.png")
  };
}

void describe("try-on execution bridge", () => {
  void it("marks a job succeeded when the process exits successfully and writes output", async () => {
    const lifecycle = new FakeTryOnExecutionLifecycle(createTryOnJobRecord());
    const { result, outputPath } = await runBridgeTest(lifecycle, "success");

    assert.deepEqual(result, {
      status: "completed",
      jobId: "10000000-0000-4000-8000-000000000001"
    });
    assert.equal(lifecycle.currentJob?.status, TryOnJobStatus.SUCCEEDED);
    assert.equal(lifecycle.currentJob?.result?.status, TryOnResultStatus.READY);
    assert.equal(lifecycle.succeededInput?.storageKey, outputPath);
    assert.equal(await fileExists(outputPath), true);
  });

  void it("marks a job failed when the process exits non-zero", async () => {
    const lifecycle = new FakeTryOnExecutionLifecycle(createTryOnJobRecord());
    const { result } = await runBridgeTest(lifecycle, "fail");

    assert.equal(result.status, "failed");
    assert.equal(lifecycle.currentJob?.status, TryOnJobStatus.FAILED);
    assert.equal(lifecycle.failedInput?.code, "try_on_executor_failed");
    assert.match(lifecycle.failedInput?.message ?? "", /fake executor failed/);
  });

  void it("marks a job failed when the process times out", async () => {
    const lifecycle = new FakeTryOnExecutionLifecycle(createTryOnJobRecord());
    const { result } = await runBridgeTest(lifecycle, "timeout", 50);

    assert.equal(result.status, "failed");
    assert.equal(lifecycle.currentJob?.status, TryOnJobStatus.FAILED);
    assert.equal(lifecycle.failedInput?.code, "try_on_executor_timeout");
  });

  void it("marks a job failed when output is missing", async () => {
    const lifecycle = new FakeTryOnExecutionLifecycle(createTryOnJobRecord());
    const { result, outputPath } = await runBridgeTest(lifecycle, "missing-output");

    assert.equal(result.status, "failed");
    assert.equal(lifecycle.currentJob?.status, TryOnJobStatus.FAILED);
    assert.equal(lifecycle.failedInput?.code, "try_on_output_missing");
    assert.equal(await fileExists(outputPath), false);
  });

  void it("does not execute a process when the job is already cancelled", async () => {
    const lifecycle = new FakeTryOnExecutionLifecycle(
      createTryOnJobRecord({
        status: TryOnJobStatus.CANCELLED,
        cancelledAt: new Date()
      })
    );
    const { result, outputPath } = await runBridgeTest(lifecycle, "success");

    assert.deepEqual(result, {
      status: "cancelled",
      jobId: "10000000-0000-4000-8000-000000000001"
    });
    assert.equal(lifecycle.currentJob?.status, TryOnJobStatus.CANCELLED);
    assert.equal(await fileExists(outputPath), false);
  });
});
