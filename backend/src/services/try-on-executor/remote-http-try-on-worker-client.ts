import type { ZodSchema } from "zod";

import {
  remoteTryOnCancelJobResponseSchema,
  remoteTryOnJobStatusResponseSchema,
  remoteTryOnResultMetadataResponseSchema,
  remoteTryOnSubmitJobResponseSchema,
  type RemoteTryOnCancelJobResponse,
  type RemoteTryOnJobStatusResponse,
  type RemoteTryOnResultMetadataResponse,
  type RemoteTryOnSubmitJobRequest,
  type RemoteTryOnSubmitJobResponse,
  type RemoteTryOnWorkerClient
} from "./remote-try-on-worker-client.js";

export type RemoteHttpTryOnWorkerClientConfig = {
  enabled: boolean;
  baseUrl: string;
  apiKey?: string;
  timeoutMs: number;
  submitPath: string;
  statusPathTemplate: string;
  cancelPathTemplate: string;
  resultPathTemplate: string;
};

export class RemoteTryOnWorkerClientError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly retryable: boolean
  ) {
    super(message);
    this.name = "RemoteTryOnWorkerClientError";
  }
}

function assertEnabled(config: RemoteHttpTryOnWorkerClientConfig): void {
  if (!config.enabled) {
    throw new RemoteTryOnWorkerClientError(
      "try_on_remote_config_disabled",
      "Remote try-on worker execution is disabled.",
      false
    );
  }

  if (config.baseUrl.trim().length === 0) {
    throw new RemoteTryOnWorkerClientError(
      "try_on_remote_config_invalid",
      "Remote try-on worker base URL must be configured.",
      false
    );
  }

  if (config.timeoutMs <= 0) {
    throw new RemoteTryOnWorkerClientError(
      "try_on_remote_config_invalid",
      "Remote try-on worker timeout must be positive.",
      false
    );
  }
}

function buildUrl(config: RemoteHttpTryOnWorkerClientConfig, pathTemplate: string): URL {
  assertEnabled(config);

  try {
    return new URL(pathTemplate, config.baseUrl);
  } catch {
    throw new RemoteTryOnWorkerClientError(
      "try_on_remote_config_invalid",
      "Remote try-on worker URL configuration is invalid.",
      false
    );
  }
}

function renderWorkerJobPath(pathTemplate: string, workerJobId: string): string {
  return pathTemplate.replaceAll("{workerJobId}", encodeURIComponent(workerJobId));
}

async function parseResponseBody(response: Response): Promise<unknown> {
  const responseText = await response.text();

  if (responseText.trim().length === 0) {
    return null;
  }

  try {
    return JSON.parse(responseText) as unknown;
  } catch {
    throw new RemoteTryOnWorkerClientError(
      "try_on_remote_response_malformed",
      "Remote try-on worker returned malformed JSON.",
      false
    );
  }
}

function validatePayload<T>(schema: ZodSchema<T>, payload: unknown): T {
  const parsed = schema.safeParse(payload);

  if (!parsed.success) {
    throw new RemoteTryOnWorkerClientError(
      "try_on_remote_response_malformed",
      "Remote try-on worker response did not match the expected contract.",
      false
    );
  }

  return parsed.data;
}

export class RemoteHttpTryOnWorkerClient implements RemoteTryOnWorkerClient {
  constructor(private readonly config: RemoteHttpTryOnWorkerClientConfig) {}

  submitInferenceJob(request: RemoteTryOnSubmitJobRequest): Promise<RemoteTryOnSubmitJobResponse> {
    return this.send("POST", this.config.submitPath, request, remoteTryOnSubmitJobResponseSchema);
  }

  getWorkerJobStatus(workerJobId: string): Promise<RemoteTryOnJobStatusResponse> {
    return this.send(
      "GET",
      renderWorkerJobPath(this.config.statusPathTemplate, workerJobId),
      undefined,
      remoteTryOnJobStatusResponseSchema
    );
  }

  cancelWorkerJob(workerJobId: string): Promise<RemoteTryOnCancelJobResponse> {
    return this.send(
      "POST",
      renderWorkerJobPath(this.config.cancelPathTemplate, workerJobId),
      undefined,
      remoteTryOnCancelJobResponseSchema
    );
  }

  fetchResultMetadata(workerJobId: string): Promise<RemoteTryOnResultMetadataResponse> {
    return this.send(
      "GET",
      renderWorkerJobPath(this.config.resultPathTemplate, workerJobId),
      undefined,
      remoteTryOnResultMetadataResponseSchema
    );
  }

  private async send<T>(
    method: "GET" | "POST",
    pathTemplate: string,
    body: unknown,
    schema: ZodSchema<T>
  ): Promise<T> {
    const url = buildUrl(this.config, pathTemplate);
    const abortController = new AbortController();
    const timeout = setTimeout(() => {
      abortController.abort();
    }, this.config.timeoutMs);

    try {
      const response = await fetch(url, {
        method,
        headers: {
          accept: "application/json",
          ...(body === undefined ? {} : { "content-type": "application/json" }),
          ...(this.config.apiKey === undefined
            ? {}
            : { authorization: `Bearer ${this.config.apiKey}` })
        },
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: abortController.signal
      });
      const payload = await parseResponseBody(response);

      if (!response.ok) {
        throw new RemoteTryOnWorkerClientError(
          "try_on_remote_http_error",
          `Remote try-on worker returned HTTP ${response.status}.`,
          response.status >= 500
        );
      }

      return validatePayload(schema, payload);
    } catch (error) {
      if (error instanceof RemoteTryOnWorkerClientError) {
        throw error;
      }

      const errorName =
        typeof error === "object" && error !== null && "name" in error ? String(error.name) : "";

      if (errorName === "AbortError") {
        throw new RemoteTryOnWorkerClientError(
          "try_on_remote_timeout",
          "Remote try-on worker request timed out.",
          true
        );
      }

      throw new RemoteTryOnWorkerClientError(
        "try_on_remote_network_error",
        "Remote try-on worker request failed.",
        true
      );
    } finally {
      clearTimeout(timeout);
    }
  }
}
