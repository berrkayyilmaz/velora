import { stat } from "node:fs/promises";
import path from "node:path";

import { z } from "zod";

import { LocalProcessTryOnExecutor } from "./local-process-try-on-executor.js";
import type {
  TryOnInferenceExecutionResult,
  TryOnInferenceExecutor,
  TryOnInferenceRequest
} from "./try-on-executor.js";

const modelResultSchema = z.object({
  durationMs: z.number(),
  error: z.string().nullable(),
  height: z.number().int().positive(),
  metadata: z.record(z.string()),
  modelId: z.string(),
  modelVersion: z.string(),
  outputId: z.string(),
  outputPath: z.string().nullable(),
  seed: z.number().int(),
  status: z.enum(["succeeded", "failed"]),
  warnings: z.array(z.string()),
  width: z.number().int().positive()
});

export type CatVTONMlCliClothType = "upper" | "lower" | "overall";

export type CatVTONMlCliConfig = {
  enabled: boolean;
  command: string;
  commandArgsPrefix: string[];
  workingDirectory: string;
  timeoutMs: number;
  personImageRoot: string;
  catalogGarmentRoot: string;
  wardrobeGarmentRoot: string;
  outputDirectory: string;
  personImagePathTemplate: string;
  catalogGarmentPathTemplate: string;
  wardrobeGarmentPathTemplate: string;
  clothType: CatVTONMlCliClothType;
  seed: number;
  inferenceSteps: number;
  guidanceScale: number;
  width: number;
  height: number;
  device: string;
  baseModelPath: string;
  resumePath: string;
};

export class CatVTONMlCliConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CatVTONMlCliConfigError";
  }
}

function requireEnabled(config: CatVTONMlCliConfig): void {
  if (!config.enabled) {
    throw new CatVTONMlCliConfigError(
      "CatVTON ML CLI execution is disabled. Set explicit try-on ML configuration before enabling it."
    );
  }
}

function requireNonEmpty(value: string, fieldName: string): void {
  if (value.trim().length === 0) {
    throw new CatVTONMlCliConfigError(`${fieldName} must be configured.`);
  }
}

function normalizeRoot(root: string, fieldName: string): string {
  requireNonEmpty(root, fieldName);
  return path.resolve(root);
}

function renderTemplate(template: string, request: TryOnInferenceRequest): string {
  const productId =
    request.garmentSource.type === "catalog_product" ? request.garmentSource.productId : "";
  const wardrobeItemId =
    request.garmentSource.type === "wardrobe_item" ? request.garmentSource.wardrobeItemId : "";

  return template
    .replaceAll("{jobId}", request.jobId)
    .replaceAll("{personImageAssetId}", request.personImageAssetId)
    .replaceAll("{garmentSourceType}", request.garmentSource.type)
    .replaceAll("{productId}", productId)
    .replaceAll("{wardrobeItemId}", wardrobeItemId);
}

function resolveInsideRoot(root: string, renderedPath: string, fieldName: string): string {
  requireNonEmpty(renderedPath, fieldName);

  if (path.isAbsolute(renderedPath)) {
    throw new CatVTONMlCliConfigError(`${fieldName} must render to a relative path.`);
  }

  const normalizedRoot = normalizeRoot(root, `${fieldName} root`);
  const resolvedPath = path.resolve(normalizedRoot, renderedPath);
  const relativePath = path.relative(normalizedRoot, resolvedPath);

  if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
    throw new CatVTONMlCliConfigError(`${fieldName} resolved outside of its configured root.`);
  }

  return resolvedPath;
}

function resolvePersonImagePath(
  config: CatVTONMlCliConfig,
  request: TryOnInferenceRequest
): string {
  return resolveInsideRoot(
    config.personImageRoot,
    renderTemplate(config.personImagePathTemplate, request),
    "person image path"
  );
}

function resolveGarmentImagePath(
  config: CatVTONMlCliConfig,
  request: TryOnInferenceRequest
): string {
  const root =
    request.garmentSource.type === "catalog_product"
      ? config.catalogGarmentRoot
      : config.wardrobeGarmentRoot;
  const template =
    request.garmentSource.type === "catalog_product"
      ? config.catalogGarmentPathTemplate
      : config.wardrobeGarmentPathTemplate;

  return resolveInsideRoot(root, renderTemplate(template, request), "garment image path");
}

function resolveOutputPath(config: CatVTONMlCliConfig, request: TryOnInferenceRequest): string {
  const normalizedOutputDirectory = normalizeRoot(config.outputDirectory, "outputDirectory");
  const outputPath = path.resolve(
    normalizedOutputDirectory,
    path.basename(request.outputArtifactPath)
  );
  const relativePath = path.relative(normalizedOutputDirectory, outputPath);

  if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
    throw new CatVTONMlCliConfigError("output path resolved outside of outputDirectory.");
  }

  return outputPath;
}

function assertRunnableConfig(config: CatVTONMlCliConfig): void {
  requireEnabled(config);
  requireNonEmpty(config.command, "command");
  if (config.commandArgsPrefix.length === 0) {
    throw new CatVTONMlCliConfigError("commandArgsPrefix must be configured.");
  }
  requireNonEmpty(config.workingDirectory, "workingDirectory");
  requireNonEmpty(config.device, "device");
  requireNonEmpty(config.baseModelPath, "baseModelPath");
  requireNonEmpty(config.resumePath, "resumePath");

  if (config.timeoutMs <= 0) {
    throw new CatVTONMlCliConfigError("timeoutMs must be positive.");
  }

  if (config.seed < 0) {
    throw new CatVTONMlCliConfigError("seed must be non-negative.");
  }

  if (config.inferenceSteps <= 0) {
    throw new CatVTONMlCliConfigError("inferenceSteps must be positive.");
  }

  if (config.guidanceScale <= 0) {
    throw new CatVTONMlCliConfigError("guidanceScale must be positive.");
  }

  if (config.width <= 0 || config.height <= 0) {
    throw new CatVTONMlCliConfigError("width and height must be positive.");
  }
}

export function buildCatVTONMlCliCommand(
  config: CatVTONMlCliConfig,
  request: TryOnInferenceRequest
): { command: string; args: string[]; cwd: string; outputArtifactPath: string } {
  assertRunnableConfig(config);

  const personImagePath = resolvePersonImagePath(config, request);
  const garmentImagePath = resolveGarmentImagePath(config, request);
  const outputArtifactPath = resolveOutputPath(config, request);

  return {
    command: config.command,
    cwd: path.resolve(config.workingDirectory),
    outputArtifactPath,
    args: [
      ...config.commandArgsPrefix,
      "--person",
      personImagePath,
      "--garment",
      garmentImagePath,
      "--cloth-type",
      config.clothType,
      "--output",
      outputArtifactPath,
      "--seed",
      String(config.seed),
      "--inference-steps",
      String(config.inferenceSteps),
      "--guidance-scale",
      String(config.guidanceScale),
      "--width",
      String(config.width),
      "--height",
      String(config.height),
      "--device",
      config.device,
      "--base-model-path",
      config.baseModelPath,
      "--resume-path",
      config.resumePath
    ]
  };
}

function parseModelResult(stdout: string): z.infer<typeof modelResultSchema> {
  let payload: unknown;

  try {
    payload = JSON.parse(stdout.trim());
  } catch {
    throw new Error("Malformed ModelResult JSON from ML CLI stdout.");
  }

  const parsed = modelResultSchema.safeParse(payload);

  if (!parsed.success) {
    throw new Error("Malformed ModelResult payload from ML CLI stdout.");
  }

  return parsed.data;
}

async function getFileSize(filePath: string): Promise<number | undefined> {
  try {
    const fileStat = await stat(filePath);
    return fileStat.size;
  } catch {
    return undefined;
  }
}

export class CatVTONMlCliExecutor implements TryOnInferenceExecutor {
  constructor(private readonly config: CatVTONMlCliConfig) {}

  async execute(request: TryOnInferenceRequest): Promise<TryOnInferenceExecutionResult> {
    let command;

    try {
      command = buildCatVTONMlCliCommand(this.config, request);
    } catch (error) {
      return {
        success: false,
        exitCode: null,
        stdout: "",
        stderr: error instanceof Error ? error.message : "Invalid CatVTON ML CLI configuration.",
        durationMs: 0,
        timedOut: false,
        errorCode: "try_on_ml_config_invalid",
        outputArtifactPath: request.outputArtifactPath
      };
    }

    const processExecutor = new LocalProcessTryOnExecutor({
      command: command.command,
      args: command.args,
      cwd: command.cwd,
      timeoutMs: this.config.timeoutMs
    });
    const executionResult = await processExecutor.execute({
      ...request,
      outputArtifactPath: command.outputArtifactPath
    });

    try {
      const modelResult = parseModelResult(executionResult.stdout);

      if (modelResult.status !== "succeeded") {
        return {
          ...executionResult,
          success: false,
          errorCode: "try_on_model_failed",
          stderr: modelResult.error ?? "ML CLI returned an unsuccessful ModelResult.",
          outputArtifactPath: modelResult.outputPath ?? executionResult.outputArtifactPath,
          width: modelResult.width,
          height: modelResult.height,
          modelId: modelResult.modelId,
          modelVersion: modelResult.modelVersion
        };
      }

      const outputArtifactPath = modelResult.outputPath ?? executionResult.outputArtifactPath;

      if (!executionResult.success) {
        return {
          ...executionResult,
          outputArtifactPath,
          success: false,
          stderr:
            executionResult.stderr.trim() ||
            `ML CLI exited with code ${executionResult.exitCode} after returning ModelResult.`,
          width: modelResult.width,
          height: modelResult.height,
          modelId: modelResult.modelId,
          modelVersion: modelResult.modelVersion
        };
      }

      return {
        ...executionResult,
        outputArtifactPath,
        width: modelResult.width,
        height: modelResult.height,
        fileSize: await getFileSize(outputArtifactPath),
        modelId: modelResult.modelId,
        modelVersion: modelResult.modelVersion
      };
    } catch (error) {
      if (!executionResult.success && executionResult.stdout.trim().length === 0) {
        return executionResult;
      }

      return {
        ...executionResult,
        success: false,
        errorCode: "try_on_model_result_malformed",
        stderr: error instanceof Error ? error.message : "Failed to parse ML CLI ModelResult."
      };
    }
  }
}
