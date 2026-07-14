import assert from "node:assert/strict";
import { mkdtemp } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

import { TryOnJobStatus, TryOnResultStatus } from "@prisma/client";

import type { TryOnJobRecord } from "../src/repositories/try-on.repository.js";
import {
  CatVTONMlCliExecutor,
  type CatVTONMlCliConfig
} from "../src/services/try-on-executor/catvton-ml-cli-executor.js";
import type {
  TryOnExecutionFailureInput,
  TryOnExecutionLifecycle,
  TryOnExecutionSuccessInput
} from "../src/services/try-on-executor/try-on-execution-bridge.js";
import { createTryOnExecutionProcessor } from "../src/services/try-on-executor/try-on-execution-bridge.js";
import { LocalTryOnJobQueue } from "../src/services/try-on-queue/local-try-on-queue.js";
import { runTryOnWorkerIteration } from "../src/services/try-on-queue/try-on-worker.js";

const currentFilePath = fileURLToPath(import.meta.url);
const currentDirectory = path.dirname(currentFilePath);
const fakeMlCliPath = path.join(currentDirectory, "fixtures", "fake-ml-cli.mjs");
const testJobId = "20000000-0000-4000-8000-000000000001";

function createTryOnJobRecord(overrides: Partial<TryOnJobRecord> = {}): TryOnJobRecord {
  const now = new Date("2026-01-01T00:00:00.000Z");

  return {
    id: testJobId,
    userId: "20000000-0000-4000-8000-000000000002",
    consentId: "20000000-0000-4000-8000-000000000003",
    personImageStorageKey: "person.png",
    productId: "20000000-0000-4000-8000-000000000004",
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
        id: "20000000-0000-4000-8000-000000000005",
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
}

async function createConfig(enabled = true): Promise<CatVTONMlCliConfig> {
  const root = await mkdtemp(path.join(os.tmpdir(), "velora-try-on-ml-cli-"));

  return {
    enabled,
    command: process.execPath,
    commandArgsPrefix: [fakeMlCliPath],
    workingDirectory: root,
    timeoutMs: 2_000,
    personImageRoot: root,
    catalogGarmentRoot: root,
    wardrobeGarmentRoot: root,
    outputDirectory: path.join(root, "output"),
    personImagePathTemplate: "{personImageAssetId}",
    catalogGarmentPathTemplate: "{productId}.png",
    wardrobeGarmentPathTemplate: "{wardrobeItemId}.png",
    clothType: "upper",
    seed: 42,
    inferenceSteps: 30,
    guidanceScale: 2.5,
    width: 768,
    height: 1024,
    device: "cpu",
    baseModelPath: "fake-base-model",
    resumePath: "fake-resume"
  };
}

async function runMlCliBridge(
  mode: string,
  enabled = true,
  jobOverrides: Partial<TryOnJobRecord> = {}
) {
  const previousMode = process.env.FAKE_ML_CLI_MODE;
  process.env.FAKE_ML_CLI_MODE = mode;

  try {
    const lifecycle = new FakeTryOnExecutionLifecycle(createTryOnJobRecord(jobOverrides));
    const queue = new LocalTryOnJobQueue();
    const config = await createConfig(enabled);

    await queue.enqueue({ jobId: testJobId });

    const result = await runTryOnWorkerIteration(
      queue,
      createTryOnExecutionProcessor(lifecycle, new CatVTONMlCliExecutor(config), {
        outputDirectory: config.outputDirectory,
        outputMediaType: "image/png",
        provider: "catvton-research",
        providerVersion: "backend-test"
      }),
      {
        workerId: "worker-ml-cli-test"
      }
    );

    return { result, lifecycle };
  } finally {
    if (previousMode === undefined) {
      delete process.env.FAKE_ML_CLI_MODE;
    } else {
      process.env.FAKE_ML_CLI_MODE = previousMode;
    }
  }
}

void describe("CatVTON ML CLI executor bridge", () => {
  void it("persists a normalized successful ModelResult", async () => {
    const { result, lifecycle } = await runMlCliBridge("success");

    assert.deepEqual(result, {
      status: "completed",
      jobId: testJobId
    });
    assert.equal(lifecycle.currentJob?.status, TryOnJobStatus.SUCCEEDED);
    assert.equal(lifecycle.succeededInput?.provider, "catvton-research");
    assert.equal(lifecycle.succeededInput?.modelVersion, "fake-test");
    assert.equal(lifecycle.succeededInput?.width, 768);
    assert.equal(lifecycle.succeededInput?.height, 1024);
    assert.equal(lifecycle.currentJob?.result?.status, TryOnResultStatus.READY);
  });

  void it("persists a normalized model failure", async () => {
    const { result, lifecycle } = await runMlCliBridge("model-failure");

    assert.equal(result.status, "failed");
    assert.equal(lifecycle.currentJob?.status, TryOnJobStatus.FAILED);
    assert.equal(lifecycle.failedInput?.code, "try_on_model_failed");
    assert.match(lifecycle.failedInput?.message ?? "", /normalized fake model failure/);
  });

  void it("returns a clear error for malformed ModelResult stdout", async () => {
    const { result, lifecycle } = await runMlCliBridge("malformed");

    assert.equal(result.status, "failed");
    assert.equal(lifecycle.currentJob?.status, TryOnJobStatus.FAILED);
    assert.equal(lifecycle.failedInput?.code, "try_on_model_result_malformed");
  });

  void it("returns a clear error when the output artifact is missing", async () => {
    const { result, lifecycle } = await runMlCliBridge("missing-output");

    assert.equal(result.status, "failed");
    assert.equal(lifecycle.currentJob?.status, TryOnJobStatus.FAILED);
    assert.equal(lifecycle.failedInput?.code, "try_on_output_missing");
  });

  void it("keeps real execution disabled until explicit configuration is enabled", async () => {
    const { result, lifecycle } = await runMlCliBridge("success", false);

    assert.equal(result.status, "failed");
    assert.equal(lifecycle.currentJob?.status, TryOnJobStatus.FAILED);
    assert.equal(lifecycle.failedInput?.code, "try_on_ml_config_invalid");
  });

  void it("returns a clear error for invalid configured input paths", async () => {
    const { result, lifecycle } = await runMlCliBridge("success", true, {
      personImageStorageKey: "../person.png"
    });

    assert.equal(result.status, "failed");
    assert.equal(lifecycle.currentJob?.status, TryOnJobStatus.FAILED);
    assert.equal(lifecycle.failedInput?.code, "try_on_ml_config_invalid");
    assert.match(lifecycle.failedInput?.message ?? "", /outside of its configured root/);
  });
});
