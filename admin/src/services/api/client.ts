import axios, { isAxiosError } from "axios";

import { env } from "@/config/env";

type AdminApiAuthHandlers = {
  getAccessToken: () => string | null;
  onUnauthorized: () => void | Promise<void>;
};

const defaultAuthHandlers: AdminApiAuthHandlers = {
  getAccessToken: () => null,
  onUnauthorized: () => undefined
};

let authHandlers = defaultAuthHandlers;
let unauthorizedHandlingPromise: Promise<void> | null = null;

export function configureAdminApiAuth(handlers: AdminApiAuthHandlers): () => void {
  authHandlers = handlers;

  return () => {
    if (authHandlers === handlers) {
      authHandlers = defaultAuthHandlers;
    }
  };
}

export const adminApiClient = axios.create({
  baseURL: env.apiBaseUrl,
  timeout: 10_000,
  headers: {
    Accept: "application/json"
  }
});

adminApiClient.interceptors.request.use((config) => {
  const accessToken = authHandlers.getAccessToken();

  if (accessToken !== null) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
});

adminApiClient.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    if (isAxiosError(error) && error.response?.status === 401) {
      if (unauthorizedHandlingPromise === null) {
        unauthorizedHandlingPromise = Promise.resolve(authHandlers.onUnauthorized()).finally(() => {
          unauthorizedHandlingPromise = null;
        });
      }

      await unauthorizedHandlingPromise;
    }

    return Promise.reject(error);
  }
);
