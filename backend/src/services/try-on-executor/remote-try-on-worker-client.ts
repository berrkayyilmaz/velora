import { z } from "zod";

import type { TryOnInferenceRequest } from "./try-on-executor.js";

export const remoteTryOnWorkerStatusSchema = z.enum([
  "queued",
  "processing",
  "succeeded",
  "failed",
  "cancelled"
]);

const remoteTryOnWorkerErrorSchema = z.object({
  code: z.string().min(1),
  message: z.string().min(1),
  retryable: z.boolean().optional()
});

export const remoteTryOnSubmitJobResponseSchema = z.object({
  workerJobId: z.string().min(1),
  status: remoteTryOnWorkerStatusSchema
});

export const remoteTryOnJobStatusResponseSchema = z.object({
  workerJobId: z.string().min(1),
  status: remoteTryOnWorkerStatusSchema,
  error: remoteTryOnWorkerErrorSchema.nullable().optional()
});

export const remoteTryOnCancelJobResponseSchema = z.object({
  workerJobId: z.string().min(1),
  status: remoteTryOnWorkerStatusSchema,
  cancelled: z.boolean()
});

export const remoteTryOnResultMetadataResponseSchema = z.object({
  workerJobId: z.string().min(1),
  status: z.literal("succeeded"),
  outputArtifactPath: z.string().min(1),
  mediaType: z.string().min(1).optional(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  fileSize: z.number().int().nonnegative().optional(),
  modelId: z.string().optional(),
  modelVersion: z.string().optional()
});

export type RemoteTryOnWorkerStatus = z.infer<typeof remoteTryOnWorkerStatusSchema>;
export type RemoteTryOnWorkerError = z.infer<typeof remoteTryOnWorkerErrorSchema>;

export type RemoteTryOnSubmitJobRequest = TryOnInferenceRequest;
export type RemoteTryOnSubmitJobResponse = z.infer<typeof remoteTryOnSubmitJobResponseSchema>;
export type RemoteTryOnJobStatusResponse = z.infer<typeof remoteTryOnJobStatusResponseSchema>;
export type RemoteTryOnCancelJobResponse = z.infer<typeof remoteTryOnCancelJobResponseSchema>;
export type RemoteTryOnResultMetadataResponse = z.infer<
  typeof remoteTryOnResultMetadataResponseSchema
>;

export type RemoteTryOnWorkerClient = {
  submitInferenceJob(request: RemoteTryOnSubmitJobRequest): Promise<RemoteTryOnSubmitJobResponse>;
  getWorkerJobStatus(workerJobId: string): Promise<RemoteTryOnJobStatusResponse>;
  cancelWorkerJob(workerJobId: string): Promise<RemoteTryOnCancelJobResponse>;
  fetchResultMetadata(workerJobId: string): Promise<RemoteTryOnResultMetadataResponse>;
};
