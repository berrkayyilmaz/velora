import { z } from "zod";

const emailSchema = z
  .string()
  .trim()
  .min(1, "Email is required.")
  .email("Enter a valid email address.")
  .transform((email) => email.toLowerCase());

export const loginFormSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required.").max(128, "Password is too long.")
});

export const registerFormSchema = z.object({
  displayName: z.string().trim().max(100, "Name must be 100 characters or fewer."),
  email: emailSchema,
  password: z
    .string()
    .min(8, "Password must be at least 8 characters.")
    .max(128, "Password is too long.")
});

export type LoginFormValues = z.infer<typeof loginFormSchema>;
export type RegisterFormValues = z.infer<typeof registerFormSchema>;
