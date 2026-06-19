import { create } from "axios";

import { env } from "@/config/env";
import { useAuthStore } from "@/store/auth.store";

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
