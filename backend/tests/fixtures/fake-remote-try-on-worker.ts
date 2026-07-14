import { writeFile } from "node:fs/promises";
import http, { type IncomingMessage, type ServerResponse } from "node:http";

import type { AddressInfo } from "node:net";

import type { RemoteTryOnWorkerStatus } from "../../src/services/try-on-executor/remote-try-on-worker-client.js";

export type FakeRemoteTryOnWorkerScenario = {
  workerJobId?: string;
  submitStatus?: RemoteTryOnWorkerStatus;
  statusSequence?: RemoteTryOnWorkerStatus[];
  result?: {
    outputArtifactPath?: string;
    mediaType?: string;
    width?: number;
    height?: number;
    fileSize?: number;
    modelId?: string;
    modelVersion?: string;
  };
  failure?: {
    code: string;
    message: string;
    retryable?: boolean;
  };
  malformedRoute?: "submit" | "status" | "cancel" | "result";
  delayMs?: number;
  createOutputArtifact?: boolean;
};

export type FakeRemoteTryOnWorker = {
  baseUrl: string;
  submittedBodies: unknown[];
  close(): Promise<void>;
};

async function readRequestBody(request: IncomingMessage): Promise<unknown> {
  let body = "";

  for await (const chunk of request as AsyncIterable<Buffer | string>) {
    body += typeof chunk === "string" ? chunk : chunk.toString("utf8");
  }

  if (body.trim().length === 0) {
    return null;
  }

  return JSON.parse(body) as unknown;
}

function sendJson(response: ServerResponse, statusCode: number, payload: unknown): void {
  response.writeHead(statusCode, {
    "content-type": "application/json"
  });
  response.end(JSON.stringify(payload));
}

function sendMalformed(response: ServerResponse): void {
  response.writeHead(200, {
    "content-type": "application/json"
  });
  response.end("{not-json");
}

async function maybeDelay(delayMs: number | undefined): Promise<void> {
  if (delayMs === undefined) {
    return;
  }

  await new Promise((resolve) => {
    setTimeout(resolve, delayMs);
  });
}

export async function startFakeRemoteTryOnWorker(
  scenario: FakeRemoteTryOnWorkerScenario
): Promise<FakeRemoteTryOnWorker> {
  const workerJobId = scenario.workerJobId ?? "remote-job-1";
  const submittedBodies: unknown[] = [];
  const statusSequence = [...(scenario.statusSequence ?? ["succeeded"])];
  let lastSubmittedBody: { outputArtifactPath?: string } | null = null;

  const server = http.createServer((request, response) => {
    void (async () => {
      await maybeDelay(scenario.delayMs);

      const method = request.method ?? "GET";
      const url = new URL(request.url ?? "/", "http://127.0.0.1");

      if (method === "POST" && url.pathname === "/try-on/jobs") {
        if (scenario.malformedRoute === "submit") {
          sendMalformed(response);
          return;
        }

        const body = await readRequestBody(request);
        submittedBodies.push(body);
        lastSubmittedBody = body as { outputArtifactPath?: string };
        sendJson(response, 202, {
          workerJobId,
          status: scenario.submitStatus ?? "queued"
        });
        return;
      }

      if (method === "GET" && url.pathname === `/try-on/jobs/${workerJobId}/status`) {
        if (scenario.malformedRoute === "status") {
          sendJson(response, 200, {
            unexpected: true
          });
          return;
        }

        const status = statusSequence.length > 1 ? statusSequence.shift() : statusSequence[0];
        sendJson(response, 200, {
          workerJobId,
          status,
          ...(status === "failed" && scenario.failure !== undefined
            ? { error: scenario.failure }
            : {})
        });
        return;
      }

      if (method === "POST" && url.pathname === `/try-on/jobs/${workerJobId}/cancel`) {
        if (scenario.malformedRoute === "cancel") {
          sendJson(response, 200, {
            unexpected: true
          });
          return;
        }

        sendJson(response, 200, {
          workerJobId,
          status: "cancelled",
          cancelled: true
        });
        return;
      }

      if (method === "GET" && url.pathname === `/try-on/jobs/${workerJobId}/result`) {
        if (scenario.malformedRoute === "result") {
          sendJson(response, 200, {
            unexpected: true
          });
          return;
        }

        const outputArtifactPath =
          scenario.result?.outputArtifactPath ?? lastSubmittedBody?.outputArtifactPath ?? "";

        if (scenario.createOutputArtifact && outputArtifactPath.length > 0) {
          await writeFile(outputArtifactPath, "fake remote output\n", "utf8");
        }

        sendJson(response, 200, {
          workerJobId,
          status: "succeeded",
          outputArtifactPath,
          mediaType: scenario.result?.mediaType ?? "image/png",
          width: scenario.result?.width ?? 768,
          height: scenario.result?.height ?? 1024,
          fileSize: scenario.result?.fileSize ?? 1024,
          modelId: scenario.result?.modelId ?? "remote-vton",
          modelVersion: scenario.result?.modelVersion ?? "fake-remote"
        });
        return;
      }

      sendJson(response, 404, {
        error: "not_found"
      });
    })().catch((error: unknown) => {
      sendJson(response, 500, {
        error: error instanceof Error ? error.message : "fake remote worker error"
      });
    });
  });

  await new Promise<void>((resolve) => {
    server.listen(0, "127.0.0.1", resolve);
  });

  const address = server.address() as AddressInfo;

  return {
    baseUrl: `http://127.0.0.1:${address.port}`,
    submittedBodies,
    close: () =>
      new Promise<void>((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error);
            return;
          }

          resolve();
        });
      })
  };
}
