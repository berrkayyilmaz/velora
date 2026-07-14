import path from "node:path";

import { env } from "./env.js";
import type { CatVTONMlCliConfig } from "../services/try-on-executor/catvton-ml-cli-executor.js";

function resolveBackendPath(...segments: string[]): string {
  return path.resolve(process.cwd(), ...segments);
}

export function createCatVTONMlCliConfigFromEnv(): CatVTONMlCliConfig {
  return {
    enabled: env.TRY_ON_ML_ENABLED,
    command: env.TRY_ON_ML_PYTHON_COMMAND,
    commandArgsPrefix: env.TRY_ON_ML_COMMAND_ARGS,
    workingDirectory: env.TRY_ON_ML_WORKING_DIRECTORY ?? resolveBackendPath("..", "ml"),
    timeoutMs: env.TRY_ON_ML_TIMEOUT_MS,
    personImageRoot:
      env.TRY_ON_ML_PERSON_IMAGE_ROOT ?? resolveBackendPath("storage", "try-on", "person"),
    catalogGarmentRoot:
      env.TRY_ON_ML_CATALOG_GARMENT_ROOT ??
      resolveBackendPath("storage", "try-on", "catalog-garments"),
    wardrobeGarmentRoot:
      env.TRY_ON_ML_WARDROBE_GARMENT_ROOT ??
      resolveBackendPath("storage", "try-on", "wardrobe-garments"),
    outputDirectory:
      env.TRY_ON_ML_OUTPUT_DIRECTORY ?? resolveBackendPath("storage", "try-on", "results"),
    personImagePathTemplate: env.TRY_ON_ML_PERSON_IMAGE_PATH_TEMPLATE,
    catalogGarmentPathTemplate: env.TRY_ON_ML_CATALOG_GARMENT_PATH_TEMPLATE,
    wardrobeGarmentPathTemplate: env.TRY_ON_ML_WARDROBE_GARMENT_PATH_TEMPLATE,
    clothType: env.TRY_ON_ML_CLOTH_TYPE,
    seed: env.TRY_ON_ML_SEED,
    inferenceSteps: env.TRY_ON_ML_INFERENCE_STEPS,
    guidanceScale: env.TRY_ON_ML_GUIDANCE_SCALE,
    width: env.TRY_ON_ML_WIDTH,
    height: env.TRY_ON_ML_HEIGHT,
    device: env.TRY_ON_ML_DEVICE,
    baseModelPath: env.TRY_ON_ML_BASE_MODEL_PATH,
    resumePath: env.TRY_ON_ML_RESUME_PATH
  };
}
