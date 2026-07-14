export type TryOnInferenceGarmentSource =
  | {
      type: "catalog_product";
      productId: string;
    }
  | {
      type: "wardrobe_item";
      wardrobeItemId: string;
    };

export type TryOnInferenceRequest = {
  jobId: string;
  personImageAssetId: string;
  garmentSource: TryOnInferenceGarmentSource;
  outfitId: string | null;
  outputArtifactPath: string;
};

export type TryOnInferenceExecutionResult = {
  success: boolean;
  exitCode: number | null;
  stdout: string;
  stderr: string;
  durationMs: number;
  timedOut: boolean;
  cancelled?: boolean;
  retryable?: boolean;
  outputArtifactPath: string;
  errorCode?: string;
  width?: number;
  height?: number;
  fileSize?: number;
  modelId?: string;
  modelVersion?: string;
};

export type TryOnInferenceExecutor = {
  execute(request: TryOnInferenceRequest): Promise<TryOnInferenceExecutionResult>;
};
