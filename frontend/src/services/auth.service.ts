import type {
  ForgotPasswordFormValues,
  LoginFormValues,
  RegisterFormValues,
  ResetPasswordFormValues
} from "@/schemas/auth.schemas";
import { apiClient } from "@/services/api/client";
import type { AuthSession } from "@/types/auth";

type AuthSessionResponse = {
  data: AuthSession;
};

export type PasswordResetRequestResult = {
  accepted: boolean;
  resetToken?: string;
};

type PasswordResetRequestResponse = {
  data: PasswordResetRequestResult;
};

type PasswordResetConfirmResponse = {
  data: {
    success: boolean;
  };
};

export async function login(input: LoginFormValues): Promise<AuthSession> {
  const response = await apiClient.post<AuthSessionResponse>("/auth/login", input);

  return response.data.data;
}

export async function register(input: RegisterFormValues): Promise<AuthSession> {
  const displayName = input.displayName.trim();
  const response = await apiClient.post<AuthSessionResponse>("/auth/register", {
    email: input.email,
    password: input.password,
    ...(displayName === "" ? {} : { displayName })
  });

  return response.data.data;
}

export async function requestPasswordReset(
  input: ForgotPasswordFormValues
): Promise<PasswordResetRequestResult> {
  const response = await apiClient.post<PasswordResetRequestResponse>(
    "/auth/password-reset/request",
    input
  );

  return response.data.data;
}

export async function confirmPasswordReset(input: ResetPasswordFormValues): Promise<boolean> {
  const response = await apiClient.post<PasswordResetConfirmResponse>(
    "/auth/password-reset/confirm",
    input
  );

  return response.data.data.success;
}
