import { z } from "zod";

const emailSchema = z
  .string()
  .trim()
  .email()
  .transform((email) => email.toLowerCase());

export const adminLoginRequestSchema = z
  .object({
    email: emailSchema,
    password: z.string().min(1).max(128)
  })
  .strict();

export const adminUserResponseSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});

export const adminSessionResponseSchema = z.object({
  data: z.object({
    adminUser: adminUserResponseSchema,
    authToken: z.string().min(1)
  })
});

export const adminMeResponseSchema = z.object({
  data: z.object({
    adminUser: adminUserResponseSchema
  })
});

export type AdminLoginRequest = z.infer<typeof adminLoginRequestSchema>;
export type AdminUserResponse = z.infer<typeof adminUserResponseSchema>;
export type AdminSessionResponse = z.infer<typeof adminSessionResponseSchema>;
export type AdminMeResponse = z.infer<typeof adminMeResponseSchema>;
