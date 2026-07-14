import { env } from "./env.js";
import { createCatVTONMlCliConfigFromEnv } from "./try-on-ml.js";
import { CatVTONMlCliExecutor } from "../services/try-on-executor/catvton-ml-cli-executor.js";
import { RemoteHttpTryOnExecutor } from "../services/try-on-executor/remote-http-try-on-executor.js";
import { RemoteHttpTryOnWorkerClient } from "../services/try-on-executor/remote-http-try-on-worker-client.js";
import type { TryOnInferenceExecutor } from "../services/try-on-executor/try-on-executor.js";

export type TryOnExecutorMode = "disabled" | "local-cli" | "remote-http";

export function createTryOnInferenceExecutorFromEnv(): TryOnInferenceExecutor | null {
  if (env.TRY_ON_EXECUTOR_MODE === "disabled") {
    return null;
  }

  if (env.TRY_ON_EXECUTOR_MODE === "local-cli") {
    return new CatVTONMlCliExecutor(createCatVTONMlCliConfigFromEnv());
  }

  const client = new RemoteHttpTryOnWorkerClient({
    enabled: env.TRY_ON_EXECUTOR_MODE === "remote-http",
    baseUrl: env.TRY_ON_REMOTE_WORKER_BASE_URL ?? "",
    ...(env.TRY_ON_REMOTE_WORKER_API_KEY === undefined
      ? {}
      : { apiKey: env.TRY_ON_REMOTE_WORKER_API_KEY }),
    timeoutMs: env.TRY_ON_REMOTE_WORKER_TIMEOUT_MS,
    submitPath: env.TRY_ON_REMOTE_WORKER_SUBMIT_PATH,
    statusPathTemplate: env.TRY_ON_REMOTE_WORKER_STATUS_PATH,
    cancelPathTemplate: env.TRY_ON_REMOTE_WORKER_CANCEL_PATH,
    resultPathTemplate: env.TRY_ON_REMOTE_WORKER_RESULT_PATH
  });

  return new RemoteHttpTryOnExecutor(client, {
    enabled: env.TRY_ON_EXECUTOR_MODE === "remote-http",
    pollIntervalMs: env.TRY_ON_REMOTE_WORKER_POLL_INTERVAL_MS,
    maxWaitMs: env.TRY_ON_REMOTE_WORKER_MAX_WAIT_MS
  });
}
