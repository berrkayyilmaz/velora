import type {
  RemoteTryOnJobStatusResponse,
  RemoteTryOnResultMetadataResponse,
  RemoteTryOnWorkerClient
} from "./remote-try-on-worker-client.js";
import { RemoteTryOnWorkerClientError } from "./remote-http-try-on-worker-client.js";
import type {
  TryOnInferenceExecutionResult,
  TryOnInferenceExecutor,
  TryOnInferenceRequest
} from "./try-on-executor.js";

export type RemoteHttpTryOnExecutorConfig = {
  enabled: boolean;
  pollIntervalMs: number;
  maxWaitMs: number;
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function disabledResult(request: TryOnInferenceRequest): TryOnInferenceExecutionResult {
  return {
    success: false,
    exitCode: null,
    stdout: "",
    stderr: "Remote HTTP try-on execution is disabled.",
    durationMs: 0,
    timedOut: false,
    cancelled: false,
    retryable: false,
    errorCode: "try_on_remote_config_disabled",
    outputArtifactPath: request.outputArtifactPath
  };
}

function clientErrorResult(
  request: TryOnInferenceRequest,
  error: RemoteTryOnWorkerClientError,
  durationMs: number
): TryOnInferenceExecutionResult {
  return {
    success: false,
    exitCode: null,
    stdout: "",
    stderr: error.message,
    durationMs,
    timedOut: error.code === "try_on_remote_timeout",
    cancelled: false,
    retryable: error.retryable,
    errorCode: error.code,
    outputArtifactPath: request.outputArtifactPath
  };
}

function remoteFailureResult(
  request: TryOnInferenceRequest,
  status: RemoteTryOnJobStatusResponse,
  durationMs: number
): TryOnInferenceExecutionResult {
  const error = status.error;

  return {
    success: false,
    exitCode: null,
    stdout: JSON.stringify(status),
    stderr: error?.message ?? "Remote try-on worker reported failure.",
    durationMs,
    timedOut: false,
    cancelled: false,
    retryable: error?.retryable ?? false,
    errorCode: error?.code ?? "try_on_remote_worker_failed",
    outputArtifactPath: request.outputArtifactPath
  };
}

function remoteCancelledResult(
  request: TryOnInferenceRequest,
  status: RemoteTryOnJobStatusResponse,
  durationMs: number
): TryOnInferenceExecutionResult {
  return {
    success: false,
    exitCode: null,
    stdout: JSON.stringify(status),
    stderr: "Remote try-on worker job was cancelled.",
    durationMs,
    timedOut: false,
    cancelled: true,
    retryable: false,
    errorCode: "try_on_remote_worker_cancelled",
    outputArtifactPath: request.outputArtifactPath
  };
}

function successResult(
  request: TryOnInferenceRequest,
  resultMetadata: RemoteTryOnResultMetadataResponse,
  durationMs: number
): TryOnInferenceExecutionResult {
  return {
    success: true,
    exitCode: null,
    stdout: JSON.stringify(resultMetadata),
    stderr: "",
    durationMs,
    timedOut: false,
    cancelled: false,
    retryable: false,
    outputArtifactPath: resultMetadata.outputArtifactPath || request.outputArtifactPath,
    width: resultMetadata.width,
    height: resultMetadata.height,
    fileSize: resultMetadata.fileSize,
    modelId: resultMetadata.modelId,
    modelVersion: resultMetadata.modelVersion
  };
}

export class RemoteHttpTryOnExecutor implements TryOnInferenceExecutor {
  constructor(
    private readonly client: RemoteTryOnWorkerClient,
    private readonly config: RemoteHttpTryOnExecutorConfig
  ) {}

  async execute(request: TryOnInferenceRequest): Promise<TryOnInferenceExecutionResult> {
    const startedAt = Date.now();

    if (!this.config.enabled) {
      return disabledResult(request);
    }

    try {
      const submittedJob = await this.client.submitInferenceJob(request);
      let status: RemoteTryOnJobStatusResponse = {
        workerJobId: submittedJob.workerJobId,
        status: submittedJob.status
      };

      while (true) {
        const durationMs = Date.now() - startedAt;

        if (durationMs > this.config.maxWaitMs) {
          return {
            success: false,
            exitCode: null,
            stdout: JSON.stringify(status),
            stderr: "Remote try-on worker polling timed out.",
            durationMs,
            timedOut: true,
            cancelled: false,
            retryable: true,
            errorCode: "try_on_remote_poll_timeout",
            outputArtifactPath: request.outputArtifactPath
          };
        }

        if (status.status === "succeeded") {
          const resultMetadata = await this.client.fetchResultMetadata(status.workerJobId);
          return successResult(request, resultMetadata, Date.now() - startedAt);
        }

        if (status.status === "failed") {
          return remoteFailureResult(request, status, Date.now() - startedAt);
        }

        if (status.status === "cancelled") {
          return remoteCancelledResult(request, status, Date.now() - startedAt);
        }

        await sleep(this.config.pollIntervalMs);
        status = await this.client.getWorkerJobStatus(status.workerJobId);
      }
    } catch (error) {
      if (error instanceof RemoteTryOnWorkerClientError) {
        return clientErrorResult(request, error, Date.now() - startedAt);
      }

      return {
        success: false,
        exitCode: null,
        stdout: "",
        stderr: error instanceof Error ? error.message : "Remote try-on executor failed.",
        durationMs: Date.now() - startedAt,
        timedOut: false,
        cancelled: false,
        retryable: true,
        errorCode: "try_on_remote_executor_failed",
        outputArtifactPath: request.outputArtifactPath
      };
    }
  }
}
