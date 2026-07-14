import { spawn } from "node:child_process";

import type {
  TryOnInferenceExecutionResult,
  TryOnInferenceExecutor,
  TryOnInferenceRequest
} from "./try-on-executor.js";

export type LocalProcessTryOnExecutorConfig = {
  command: string;
  args: string[];
  timeoutMs: number;
  cwd?: string;
  env?: Record<string, string>;
};

function renderArg(arg: string, request: TryOnInferenceRequest): string {
  const optionalProductId =
    request.garmentSource.type === "catalog_product" ? request.garmentSource.productId : "";
  const optionalWardrobeItemId =
    request.garmentSource.type === "wardrobe_item" ? request.garmentSource.wardrobeItemId : "";

  return arg
    .replaceAll("{jobId}", request.jobId)
    .replaceAll("{personImageAssetId}", request.personImageAssetId)
    .replaceAll("{garmentSourceType}", request.garmentSource.type)
    .replaceAll("{productId}", optionalProductId)
    .replaceAll("{wardrobeItemId}", optionalWardrobeItemId)
    .replaceAll("{outfitId}", request.outfitId ?? "")
    .replaceAll("{outputArtifactPath}", request.outputArtifactPath);
}

function renderArgs(args: string[], request: TryOnInferenceRequest): string[] {
  return args.map((arg) => renderArg(arg, request));
}

export class LocalProcessTryOnExecutor implements TryOnInferenceExecutor {
  constructor(private readonly config: LocalProcessTryOnExecutorConfig) {}

  execute(request: TryOnInferenceRequest): Promise<TryOnInferenceExecutionResult> {
    const startedAt = Date.now();
    const args = renderArgs(this.config.args, request);

    return new Promise((resolve) => {
      let stdout = "";
      let stderr = "";
      let settled = false;
      let timedOut = false;

      const child = spawn(this.config.command, args, {
        cwd: this.config.cwd,
        env: {
          ...process.env,
          ...this.config.env
        },
        shell: false,
        windowsHide: true
      });

      const timeout = setTimeout(() => {
        timedOut = true;
        child.kill();
      }, this.config.timeoutMs);

      child.stdout.setEncoding("utf8");
      child.stderr.setEncoding("utf8");

      child.stdout.on("data", (chunk: string) => {
        stdout += chunk;
      });

      child.stderr.on("data", (chunk: string) => {
        stderr += chunk;
      });

      child.on("error", (error) => {
        if (settled) {
          return;
        }

        settled = true;
        clearTimeout(timeout);
        resolve({
          success: false,
          exitCode: null,
          stdout,
          stderr: `${stderr}${stderr.length > 0 ? "\n" : ""}${error.message}`,
          durationMs: Date.now() - startedAt,
          timedOut: false,
          outputArtifactPath: request.outputArtifactPath
        });
      });

      child.on("close", (exitCode) => {
        if (settled) {
          return;
        }

        settled = true;
        clearTimeout(timeout);
        resolve({
          success: exitCode === 0 && !timedOut,
          exitCode,
          stdout,
          stderr,
          durationMs: Date.now() - startedAt,
          timedOut,
          outputArtifactPath: request.outputArtifactPath
        });
      });
    });
  }
}
