import { mkdir, rename, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";

import type {
  RemoteTryOnArtifactDownload,
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
  localArtifact: { outputArtifactPath: string; fileSize: number; mediaType: string },
  durationMs: number
): TryOnInferenceExecutionResult {
  const normalizedMetadata = {
    ...resultMetadata,
    outputArtifactPath: localArtifact.outputArtifactPath,
    mediaType: resultMetadata.mediaType ?? localArtifact.mediaType,
    fileSize: localArtifact.fileSize
  };

  return {
    success: true,
    exitCode: null,
    stdout: JSON.stringify(normalizedMetadata),
    stderr: "",
    durationMs,
    timedOut: false,
    cancelled: false,
    retryable: false,
    outputArtifactPath: localArtifact.outputArtifactPath,
    mediaType: resultMetadata.mediaType ?? localArtifact.mediaType,
    width: resultMetadata.width,
    height: resultMetadata.height,
    fileSize: localArtifact.fileSize,
    modelId: resultMetadata.modelId,
    modelVersion: resultMetadata.modelVersion
  };
}

async function persistDownloadedArtifact(
  outputArtifactPath: string,
  artifact: RemoteTryOnArtifactDownload
): Promise<{ outputArtifactPath: string; fileSize: number; mediaType: string }> {
  if (artifact.bytes.byteLength === 0) {
    throw new RemoteTryOnWorkerClientError(
      "try_on_remote_artifact_empty",
      "Remote try-on worker returned an empty artifact.",
      false
    );
  }

  const outputDirectory = path.dirname(outputArtifactPath);
  const temporaryPath = path.join(
    outputDirectory,
    `.${path.basename(outputArtifactPath)}.${process.pid}.${Date.now()}.tmp`
  );

  try {
    await mkdir(outputDirectory, { recursive: true });
    await writeFile(temporaryPath, artifact.bytes);
    const temporaryStats = await stat(temporaryPath);

    if (temporaryStats.size === 0) {
      throw new RemoteTryOnWorkerClientError(
        "try_on_remote_artifact_empty",
        "Remote try-on worker returned an empty artifact.",
        false
      );
    }

    await rename(temporaryPath, outputArtifactPath);

    return {
      outputArtifactPath,
      fileSize: temporaryStats.size,
      mediaType: artifact.mediaType
    };
  } catch (error) {
    await rm(temporaryPath, { force: true }).catch(() => undefined);

    if (error instanceof RemoteTryOnWorkerClientError) {
      throw error;
    }

    throw new RemoteTryOnWorkerClientError(
      "try_on_remote_artifact_write_failed",
      "Downloaded try-on artifact could not be written locally.",
      false
    );
  }
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
          const artifact = await this.client.downloadArtifact(status.workerJobId);
          const localArtifact = await persistDownloadedArtifact(
            request.outputArtifactPath,
            artifact
          );
          return successResult(request, resultMetadata, localArtifact, Date.now() - startedAt);
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
