import assert from "node:assert/strict";
import { mkdtemp } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, it } from "node:test";

import { TryOnJobStatus, TryOnResultStatus } from "@prisma/client";

import type { TryOnJobRecord } from "../src/repositories/try-on.repository.js";
import {
  RemoteHttpTryOnWorkerClient,
  type RemoteHttpTryOnWorkerClientConfig
} from "../src/services/try-on-executor/remote-http-try-on-worker-client.js";
import { RemoteHttpTryOnExecutor } from "../src/services/try-on-executor/remote-http-try-on-executor.js";
import type {
  TryOnExecutionFailureInput,
  TryOnExecutionLifecycle,
  TryOnExecutionSuccessInput
} from "../src/services/try-on-executor/try-on-execution-bridge.js";
import { createTryOnExecutionProcessor } from "../src/services/try-on-executor/try-on-execution-bridge.js";
import type { TryOnInferenceRequest } from "../src/services/try-on-executor/try-on-executor.js";
import { LocalTryOnJobQueue } from "../src/services/try-on-queue/local-try-on-queue.js";
import { runTryOnWorkerIteration } from "../src/services/try-on-queue/try-on-worker.js";
import { startFakeRemoteTryOnWorker } from "./fixtures/fake-remote-try-on-worker.js";

const testJobId = "30000000-0000-4000-8000-000000000001";

function createTryOnJobRecord(overrides: Partial<TryOnJobRecord> = {}): TryOnJobRecord {
  const now = new Date("2026-01-01T00:00:00.000Z");

  return {
    id: testJobId,
    userId: "30000000-0000-4000-8000-000000000002",
    consentId: "30000000-0000-4000-8000-000000000003",
    personImageStorageKey: "person.png",
    productId: "30000000-0000-4000-8000-000000000004",
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
        id: "30000000-0000-4000-8000-000000000005",
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

function createRemoteClientConfig(
  baseUrl: string,
  overrides: Partial<RemoteHttpTryOnWorkerClientConfig> = {}
): RemoteHttpTryOnWorkerClientConfig {
  return {
    enabled: true,
    baseUrl,
    timeoutMs: 500,
    submitPath: "/try-on/jobs",
    statusPathTemplate: "/try-on/jobs/{workerJobId}/status",
    cancelPathTemplate: "/try-on/jobs/{workerJobId}/cancel",
    resultPathTemplate: "/try-on/jobs/{workerJobId}/result",
    ...overrides
  };
}

async function createRequest(): Promise<TryOnInferenceRequest> {
  const outputDirectory = await mkdtemp(path.join(os.tmpdir(), "velora-remote-worker-"));

  return {
    jobId: testJobId,
    personImageAssetId: "person.png",
    garmentSource: {
      type: "catalog_product",
      productId: "30000000-0000-4000-8000-000000000004"
    },
    outfitId: null,
    outputArtifactPath: path.join(outputDirectory, `${testJobId}.png`)
  };
}

async function runRemoteBridge(scenario: Parameters<typeof startFakeRemoteTryOnWorker>[0]) {
  const fakeWorker = await startFakeRemoteTryOnWorker(scenario);

  try {
    const lifecycle = new FakeTryOnExecutionLifecycle(createTryOnJobRecord());
    const queue = new LocalTryOnJobQueue();
    const request = await createRequest();

    await queue.enqueue({ jobId: testJobId });

    const client = new RemoteHttpTryOnWorkerClient(createRemoteClientConfig(fakeWorker.baseUrl));
    const executor = new RemoteHttpTryOnExecutor(client, {
      enabled: true,
      pollIntervalMs: 1,
      maxWaitMs: 1_000
    });
    const result = await runTryOnWorkerIteration(
      queue,
      createTryOnExecutionProcessor(lifecycle, executor, {
        outputDirectory: path.dirname(request.outputArtifactPath),
        outputMediaType: "image/png",
        provider: "remote-http",
        providerVersion: "backend-test"
      }),
      {
        workerId: "worker-remote-test"
      }
    );

    return { result, lifecycle, fakeWorker };
  } finally {
    await fakeWorker.close();
  }
}

void describe("Remote HTTP try-on worker client", () => {
  void it("submits an inference job successfully", async () => {
    const fakeWorker = await startFakeRemoteTryOnWorker({ submitStatus: "queued" });

    try {
      const request = await createRequest();
      const client = new RemoteHttpTryOnWorkerClient(createRemoteClientConfig(fakeWorker.baseUrl));
      const response = await client.submitInferenceJob(request);

      assert.equal(response.workerJobId, "remote-job-1");
      assert.equal(response.status, "queued");
      assert.equal(fakeWorker.submittedBodies.length, 1);
    } finally {
      await fakeWorker.close();
    }
  });

  void it("reads a remote processing status", async () => {
    const fakeWorker = await startFakeRemoteTryOnWorker({ statusSequence: ["processing"] });

    try {
      const client = new RemoteHttpTryOnWorkerClient(createRemoteClientConfig(fakeWorker.baseUrl));
      const response = await client.getWorkerJobStatus("remote-job-1");

      assert.equal(response.status, "processing");
    } finally {
      await fakeWorker.close();
    }
  });

  void it("cancels a remote worker job", async () => {
    const fakeWorker = await startFakeRemoteTryOnWorker({});

    try {
      const client = new RemoteHttpTryOnWorkerClient(createRemoteClientConfig(fakeWorker.baseUrl));
      const response = await client.cancelWorkerJob("remote-job-1");

      assert.equal(response.status, "cancelled");
      assert.equal(response.cancelled, true);
    } finally {
      await fakeWorker.close();
    }
  });

  void it("returns retry-safe network errors", async () => {
    const request = await createRequest();
    const client = new RemoteHttpTryOnWorkerClient(createRemoteClientConfig("http://127.0.0.1:1"));
    const executor = new RemoteHttpTryOnExecutor(client, {
      enabled: true,
      pollIntervalMs: 1,
      maxWaitMs: 1_000
    });
    const result = await executor.execute(request);

    assert.equal(result.success, false);
    assert.equal(result.errorCode, "try_on_remote_network_error");
    assert.equal(result.retryable, true);
  });

  void it("normalizes a remote success result through the execution bridge", async () => {
    const { result, lifecycle } = await runRemoteBridge({
      statusSequence: ["processing", "succeeded"],
      createOutputArtifact: true
    });

    assert.deepEqual(result, {
      status: "completed",
      jobId: testJobId
    });
    assert.equal(lifecycle.currentJob?.status, TryOnJobStatus.SUCCEEDED);
    assert.equal(lifecycle.succeededInput?.provider, "remote-http");
    assert.equal(lifecycle.succeededInput?.modelVersion, "fake-remote");
    assert.equal(lifecycle.succeededInput?.width, 768);
    assert.equal(lifecycle.currentJob?.result?.status, TryOnResultStatus.READY);
  });

  void it("normalizes a remote failure through the execution bridge", async () => {
    const { result, lifecycle } = await runRemoteBridge({
      statusSequence: ["failed"],
      failure: {
        code: "remote_model_failed",
        message: "Remote model failed.",
        retryable: false
      }
    });

    assert.equal(result.status, "failed");
    assert.equal(lifecycle.currentJob?.status, TryOnJobStatus.FAILED);
    assert.equal(lifecycle.failedInput?.code, "remote_model_failed");
    assert.match(lifecycle.failedInput?.message ?? "", /Remote model failed/);
  });

  void it("returns retry-safe timeout errors", async () => {
    const fakeWorker = await startFakeRemoteTryOnWorker({
      delayMs: 100,
      statusSequence: ["processing"]
    });

    try {
      const request = await createRequest();
      const client = new RemoteHttpTryOnWorkerClient(
        createRemoteClientConfig(fakeWorker.baseUrl, { timeoutMs: 10 })
      );
      const executor = new RemoteHttpTryOnExecutor(client, {
        enabled: true,
        pollIntervalMs: 1,
        maxWaitMs: 1_000
      });
      const result = await executor.execute(request);

      assert.equal(result.success, false);
      assert.equal(result.errorCode, "try_on_remote_timeout");
      assert.equal(result.retryable, true);
      assert.equal(result.timedOut, true);
    } finally {
      await fakeWorker.close();
    }
  });

  void it("normalizes malformed remote responses", async () => {
    const { result, lifecycle } = await runRemoteBridge({
      malformedRoute: "status"
    });

    assert.equal(result.status, "failed");
    assert.equal(lifecycle.currentJob?.status, TryOnJobStatus.FAILED);
    assert.equal(lifecycle.failedInput?.code, "try_on_remote_response_malformed");
  });

  void it("handles remote cancellation", async () => {
    const { result, lifecycle } = await runRemoteBridge({
      statusSequence: ["cancelled"]
    });

    assert.deepEqual(result, {
      status: "cancelled",
      jobId: testJobId
    });
    assert.equal(lifecycle.currentJob?.status, TryOnJobStatus.CANCELLED);
  });

  void it("keeps remote execution disabled until explicitly configured", async () => {
    const request = await createRequest();
    const fakeWorker = await startFakeRemoteTryOnWorker({});

    try {
      const client = new RemoteHttpTryOnWorkerClient(
        createRemoteClientConfig(fakeWorker.baseUrl, { enabled: false })
      );
      const executor = new RemoteHttpTryOnExecutor(client, {
        enabled: false,
        pollIntervalMs: 1,
        maxWaitMs: 1_000
      });
      const result = await executor.execute(request);

      assert.equal(result.success, false);
      assert.equal(result.errorCode, "try_on_remote_config_disabled");
    } finally {
      await fakeWorker.close();
    }
  });
});
