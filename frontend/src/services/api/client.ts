import { create, isAxiosError } from "axios";
import { router } from "expo-router";

import { env } from "@/config/env";
import { queryClient } from "@/config/query-client";
import { useAuthStore } from "@/store/auth.store";

let unauthorizedHandlingPromise: Promise<void> | null = null;

async function handleUnauthorized(): Promise<void> {
  if (unauthorizedHandlingPromise === null) {
    unauthorizedHandlingPromise = (async () => {
      const hadSession = useAuthStore.getState().session !== null;

      await useAuthStore.getState().clearSession();
      queryClient.getQueryCache().clear();

      if (hadSession) {
        router.replace("/sign-in");
      }
    })().finally(() => {
      unauthorizedHandlingPromise = null;
    });
  }

  await unauthorizedHandlingPromise;
}

export const apiClient = create({
  baseURL: env.EXPO_PUBLIC_API_BASE_URL,
  timeout: 10_000,
  headers: {
    Accept: "application/json"
  }
});

apiClient.interceptors.request.use((config) => {
  const authToken = useAuthStore.getState().session?.authToken;

  if (authToken !== undefined) {
    config.headers.Authorization = `Bearer ${authToken}`;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    if (isAxiosError(error) && error.response?.status === 401) {
      await handleUnauthorized();
    }

    return Promise.reject(error);
  }
);
