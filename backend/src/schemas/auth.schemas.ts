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

export type RegisterRequest = z.infer<typeof registerRequestSchema>;
export type LoginRequest = z.infer<typeof loginRequestSchema>;
export type UserProfileResponse = z.infer<typeof userProfileResponseSchema>;
export type AuthSessionResponse = z.infer<typeof authSessionResponseSchema>;
