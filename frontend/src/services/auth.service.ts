import type { LoginFormValues, RegisterFormValues } from "@/schemas/auth.schemas";
import { apiClient } from "@/services/api/client";
import type { AuthSession } from "@/types/auth";

type AuthSessionResponse = {
  data: AuthSession;
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
