import { z } from "zod";

const emailSchema = z
  .string()
  .trim()
  .email()
  .transform((email) => email.toLowerCase());

const passwordSchema = z.string().min(8).max(128);

const displayNameSchema = z.string().trim().min(1).max(100).optional();

export const registerRequestSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  displayName: displayNameSchema
});

export const loginRequestSchema = z.object({
  email: emailSchema,
  password: z.string().min(1).max(128)
});

export const passwordResetRequestSchema = z.object({
  email: emailSchema
});

export const passwordResetConfirmRequestSchema = z.object({
  token: z.string().trim().min(32).max(256),
  newPassword: passwordSchema
});

export const userProfileResponseSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  displayName: z.string().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});

export const authSessionResponseSchema = z.object({
  data: z.object({
    user: userProfileResponseSchema,
    authToken: z.string().min(1)
  })
});

export const passwordResetRequestResponseSchema = z.object({
  data: z.object({
    accepted: z.boolean(),
    resetToken: z.string().optional()
  })
});

export const passwordResetConfirmResponseSchema = z.object({
  data: z.object({
    success: z.boolean()
  })
});

export type RegisterRequest = z.infer<typeof registerRequestSchema>;
export type LoginRequest = z.infer<typeof loginRequestSchema>;
export type PasswordResetRequest = z.infer<typeof passwordResetRequestSchema>;
export type PasswordResetConfirmRequest = z.infer<typeof passwordResetConfirmRequestSchema>;
export type UserProfileResponse = z.infer<typeof userProfileResponseSchema>;
export type AuthSessionResponse = z.infer<typeof authSessionResponseSchema>;
export type PasswordResetRequestResponse = z.infer<typeof passwordResetRequestResponseSchema>;
export type PasswordResetConfirmResponse = z.infer<typeof passwordResetConfirmResponseSchema>;
