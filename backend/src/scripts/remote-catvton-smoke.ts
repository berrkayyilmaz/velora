import { access } from "node:fs/promises";
import path from "node:path";

import { env } from "../config/env.js";
import { prisma } from "../config/prisma.js";
import { createTryOnInferenceExecutorFromEnv } from "../config/try-on-executor.js";
import { TRY_ON_CONSENT_PURPOSE } from "../repositories/try-on.repository.js";
import { createPrismaTryOnExecutionLifecycle } from "../services/try-on-executor/try-on-execution-bridge.js";
import { createTryOnExecutionProcessor } from "../services/try-on-executor/try-on-execution-bridge.js";
import { LocalTryOnJobQueue } from "../services/try-on-queue/local-try-on-queue.js";
import { runTryOnWorkerIteration } from "../services/try-on-queue/try-on-worker.js";

const RESEARCH_ONLY_NOTICE =
  "Research-only remote CatVTON smoke tooling. Do not use production secrets, user images, or generated outputs.";

type SmokeConfig = {
  backendBaseUrl: string;
  backendHealthUrl: string;
  workerBaseUrl: string;
  workerHealthUrl: string;
  authToken: string;
  productId?: string;
  wardrobeItemId?: string;
  outfitId?: string;
  personImagePath: string;
  garmentImagePath: string;
  personImageAssetId: string;
  outputDirectory: string;
  outputMediaType: string;
  timeoutMs: number;
  pollIntervalMs: number;
  idempotencyKey: string;
  workerId: string;
  providerVersion: string;
  ensureConsent: boolean;
  dryRun: boolean;
};

type ApiProfileResponse = {
  data: {
    id: string;
    email: string;
  };
};

type CreateTryOnJobResponse = {
  data: {
    id: string;
    status: string;
    result: null | {
      id: string;
      status: string;
      width: number | null;
      height: number | null;
      mediaType: string;
    };
  };
};

type PersistedTryOnResult = {
  storageKey: string;
  mediaType: string;
  width: number | null;
  height: number | null;
  fileSize: number | null;
};

function hasFlag(flag: string): boolean {
  return process.argv.includes(flag);
}

function envValue(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value === undefined || value.length === 0 ? undefined : value;
}

function requiredEnv(name: string): string {
  const value = envValue(name);
  if (value === undefined) {
    throw new Error(`${name} is required.`);
  }
  return value;
}

function booleanEnv(name: string, defaultValue: boolean): boolean {
  const value = envValue(name);
  if (value === undefined) {
    return defaultValue;
  }
  return ["1", "true", "yes", "on"].includes(value.toLowerCase());
}

function numberEnv(name: string, defaultValue: number): number {
  const value = envValue(name);
  if (value === undefined) {
    return defaultValue;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`${name} must be a positive number.`);
  }

  return parsed;
}

function deriveBackendHealthUrl(backendBaseUrl: string): string {
  const url = new URL(backendBaseUrl);
  return `${url.origin}/health`;
}

function normalizeBaseUrl(value: string): string {
  return value.replace(/\/+$/, "");
}

function loadConfig(): SmokeConfig {
  const backendBaseUrl = normalizeBaseUrl(
    envValue("TRY_ON_SMOKE_BACKEND_BASE_URL") ?? "http://127.0.0.1:4000/api/v1"
  );
  const workerBaseUrl = normalizeBaseUrl(
    envValue("TRY_ON_SMOKE_WORKER_BASE_URL") ?? env.TRY_ON_REMOTE_WORKER_BASE_URL ?? ""
  );
  const personImagePath = requiredEnv("TRY_ON_SMOKE_PERSON_IMAGE_PATH");

  return {
    backendBaseUrl,
    backendHealthUrl:
      envValue("TRY_ON_SMOKE_BACKEND_HEALTH_URL") ?? deriveBackendHealthUrl(backendBaseUrl),
    workerBaseUrl,
    workerHealthUrl: envValue("TRY_ON_SMOKE_WORKER_HEALTH_URL") ?? `${workerBaseUrl}/health`,
    authToken: requiredEnv("TRY_ON_SMOKE_AUTH_TOKEN"),
    productId: envValue("TRY_ON_SMOKE_PRODUCT_ID"),
    wardrobeItemId: envValue("TRY_ON_SMOKE_WARDROBE_ITEM_ID"),
    outfitId: envValue("TRY_ON_SMOKE_OUTFIT_ID"),
    personImagePath,
    garmentImagePath: requiredEnv("TRY_ON_SMOKE_GARMENT_IMAGE_PATH"),
    personImageAssetId:
      envValue("TRY_ON_SMOKE_PERSON_IMAGE_ASSET_ID") ?? path.basename(personImagePath),
    outputDirectory:
      envValue("TRY_ON_SMOKE_OUTPUT_DIRECTORY") ??
      path.resolve("storage", "try-on", "remote-smoke-results"),
    outputMediaType: envValue("TRY_ON_SMOKE_OUTPUT_MEDIA_TYPE") ?? "image/png",
    timeoutMs: numberEnv("TRY_ON_SMOKE_TIMEOUT_MS", 600_000),
    pollIntervalMs: numberEnv("TRY_ON_SMOKE_POLL_INTERVAL_MS", 1_000),
    idempotencyKey:
      envValue("TRY_ON_SMOKE_IDEMPOTENCY_KEY") ?? `remote-catvton-smoke-${Date.now()}`,
    workerId: envValue("TRY_ON_SMOKE_WORKER_ID") ?? "remote-catvton-smoke",
    providerVersion: envValue("TRY_ON_SMOKE_PROVIDER_VERSION") ?? "research-smoke",
    ensureConsent: booleanEnv("TRY_ON_SMOKE_ENSURE_CONSENT", true),
    dryRun: hasFlag("--dry-run") || booleanEnv("TRY_ON_SMOKE_DRY_RUN", false)
  };
}

async function assertUrlOk(url: string, label: string): Promise<void> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`${label} health check failed with HTTP ${response.status}.`);
  }
}

async function assertFileExists(filePath: string, label: string): Promise<void> {
  try {
    await access(filePath);
  } catch {
    throw new Error(`${label} does not exist: ${filePath}`);
  }
}

function validateRemoteMode(config: SmokeConfig): void {
  if (env.TRY_ON_EXECUTOR_MODE !== "remote-http") {
    throw new Error("TRY_ON_EXECUTOR_MODE must be remote-http for this smoke test.");
  }

  if (env.TRY_ON_REMOTE_WORKER_BASE_URL === undefined) {
    throw new Error("TRY_ON_REMOTE_WORKER_BASE_URL must be configured.");
  }

  if (normalizeBaseUrl(env.TRY_ON_REMOTE_WORKER_BASE_URL) !== config.workerBaseUrl) {
    throw new Error(
      "TRY_ON_SMOKE_WORKER_BASE_URL must match TRY_ON_REMOTE_WORKER_BASE_URL so the backend executor targets the checked worker."
    );
  }

  const garmentSourceCount =
    (config.productId === undefined ? 0 : 1) + (config.wardrobeItemId === undefined ? 0 : 1);
  if (garmentSourceCount !== 1) {
    throw new Error(
      "Exactly one of TRY_ON_SMOKE_PRODUCT_ID or TRY_ON_SMOKE_WARDROBE_ITEM_ID is required."
    );
  }
}

async function fetchJson<T>(url: string, init: RequestInit, errorLabel: string): Promise<T> {
  const response = await fetch(url, init);
  const text = await response.text();
  const payload = text.length === 0 ? null : (JSON.parse(text) as unknown);

  if (!response.ok) {
    throw new Error(`${errorLabel} failed with HTTP ${response.status}: ${text}`);
  }

  return payload as T;
}

async function getAuthenticatedProfile(config: SmokeConfig): Promise<ApiProfileResponse["data"]> {
  const response = await fetchJson<ApiProfileResponse>(
    `${config.backendBaseUrl}/me`,
    {
      headers: {
        authorization: `Bearer ${config.authToken}`
      }
    },
    "Authenticated profile check"
  );

  return response.data;
}

async function ensureTryOnConsent(userId: string): Promise<void> {
  const existingConsent = await prisma.tryOnConsent.findFirst({
    where: {
      userId,
      purpose: TRY_ON_CONSENT_PURPOSE,
      withdrawnAt: null
    },
    select: {
      id: true
    }
  });

  if (existingConsent !== null) {
    return;
  }

  await prisma.tryOnConsent.create({
    data: {
      userId,
      purpose: TRY_ON_CONSENT_PURPOSE,
      policyVersion: "remote-catvton-smoke",
      grantedAt: new Date()
    }
  });
}

async function createTryOnJob(config: SmokeConfig): Promise<string> {
  const body = {
    personImageAssetId: config.personImageAssetId,
    ...(config.productId === undefined ? {} : { productId: config.productId }),
    ...(config.wardrobeItemId === undefined ? {} : { wardrobeItemId: config.wardrobeItemId }),
    ...(config.outfitId === undefined ? {} : { outfitId: config.outfitId })
  };
  const response = await fetchJson<CreateTryOnJobResponse>(
    `${config.backendBaseUrl}/try-on/jobs`,
    {
      method: "POST",
      headers: {
        authorization: `Bearer ${config.authToken}`,
        "content-type": "application/json",
        "idempotency-key": config.idempotencyKey
      },
      body: JSON.stringify(body)
    },
    "Create try-on job"
  );

  return response.data.id;
}

async function processTryOnJob(jobId: string, config: SmokeConfig): Promise<void> {
  const executor = createTryOnInferenceExecutorFromEnv();
  if (executor === null) {
    throw new Error("Try-on executor is disabled.");
  }

  const queue = new LocalTryOnJobQueue();
  await queue.enqueue({ jobId });

  const result = await runTryOnWorkerIteration(
    queue,
    createTryOnExecutionProcessor(createPrismaTryOnExecutionLifecycle(prisma), executor, {
      outputDirectory: config.outputDirectory,
      outputMediaType: config.outputMediaType,
      provider: "remote-http",
      providerVersion: config.providerVersion
    }),
    {
      workerId: config.workerId
    }
  );

  if (result.status !== "completed") {
    throw new Error(`Worker iteration did not complete. Status: ${result.status}.`);
  }
}

async function pollTryOnJob(
  jobId: string,
  config: SmokeConfig
): Promise<CreateTryOnJobResponse["data"]> {
  const deadline = Date.now() + config.timeoutMs;

  while (Date.now() <= deadline) {
    const response = await fetchJson<CreateTryOnJobResponse>(
      `${config.backendBaseUrl}/try-on/jobs/${jobId}`,
      {
        headers: {
          authorization: `Bearer ${config.authToken}`
        }
      },
      "Get try-on job"
    );

    if (["succeeded", "failed", "cancelled", "expired"].includes(response.data.status)) {
      return response.data;
    }

    await new Promise((resolve) => {
      setTimeout(resolve, config.pollIntervalMs);
    });
  }

  throw new Error("Timed out waiting for try-on job terminal status.");
}

function validateResult(job: CreateTryOnJobResponse["data"]): void {
  if (job.status !== "succeeded") {
    throw new Error(`Try-on job did not succeed. Status: ${job.status}.`);
  }

  if (job.result === null) {
    throw new Error("Try-on job succeeded without TryOnResult metadata.");
  }

  if (job.result.status !== "ready") {
    throw new Error(`TryOnResult is not ready. Status: ${job.result.status}.`);
  }

  if (job.result.width === null || job.result.height === null) {
    throw new Error("TryOnResult is missing output dimensions.");
  }
}

async function validatePersistedResultArtifact(jobId: string): Promise<PersistedTryOnResult> {
  const result = await prisma.tryOnResult.findUnique({
    where: {
      jobId
    },
    select: {
      storageKey: true,
      mediaType: true,
      width: true,
      height: true,
      fileSize: true
    }
  });

  if (result === null) {
    throw new Error("Persisted TryOnResult was not found.");
  }

  if (result.width === null || result.height === null || result.fileSize === null) {
    throw new Error("Persisted TryOnResult is missing artifact metadata.");
  }

  await assertFileExists(result.storageKey, "Output artifact");

  return result;
}

async function validateConfiguration(config: SmokeConfig): Promise<void> {
  validateRemoteMode(config);
  await assertUrlOk(config.backendHealthUrl, "Backend");
  await assertUrlOk(config.workerHealthUrl, "Worker");
  await assertFileExists(config.personImagePath, "Person image");
  await assertFileExists(config.garmentImagePath, "Garment image");
}

async function run(): Promise<void> {
  console.log(RESEARCH_ONLY_NOTICE);
  const config = loadConfig();
  await validateConfiguration(config);

  if (config.dryRun) {
    console.log("REMOTE_CATVTON_SMOKE_DRY_RUN_OK");
    return;
  }

  const profile = await getAuthenticatedProfile(config);
  if (config.ensureConsent) {
    await ensureTryOnConsent(profile.id);
  }

  const jobId = await createTryOnJob(config);
  await processTryOnJob(jobId, config);
  const job = await pollTryOnJob(jobId, config);
  validateResult(job);
  const persistedResult = await validatePersistedResultArtifact(jobId);

  console.log(
    JSON.stringify(
      {
        status: "REMOTE_CATVTON_SMOKE_OK",
        jobId,
        result: job.result,
        artifact: persistedResult
      },
      null,
      2
    )
  );
}

run()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : "Remote CatVTON smoke test failed.");
    process.exitCode = 1;
  })
  .finally(() => {
    void prisma.$disconnect();
  });
