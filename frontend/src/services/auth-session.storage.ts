import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import { z } from "zod";

import type { AuthSession } from "@/types/auth";

const AUTH_SESSION_STORAGE_KEY = "velora.auth.session";

const authSessionSchema = z.object({
  authToken: z.string().min(1),
  user: z.object({
    id: z.string().min(1),
    email: z.string().email(),
    displayName: z.string().nullable(),
    createdAt: z.string(),
    updatedAt: z.string()
  })
});

type WebStorage = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
};

function getWebStorage(): WebStorage | null {
  const webGlobal = globalThis as typeof globalThis & {
    localStorage?: WebStorage;
  };

  return webGlobal.localStorage ?? null;
}

async function getStoredValue(): Promise<string | null> {
  if (Platform.OS === "web") {
    return getWebStorage()?.getItem(AUTH_SESSION_STORAGE_KEY) ?? null;
  }

  if (!(await SecureStore.isAvailableAsync())) {
    return null;
  }

  return SecureStore.getItemAsync(AUTH_SESSION_STORAGE_KEY);
}

export async function getPersistedAuthSession(): Promise<AuthSession | null> {
  const storedValue = await getStoredValue();

  if (storedValue === null) {
    return null;
  }

  try {
    const parsedSession = authSessionSchema.safeParse(JSON.parse(storedValue));

    if (parsedSession.success) {
      return parsedSession.data;
    }
  } catch {
    // Invalid persisted data is removed below.
  }

  await clearPersistedAuthSession();

  return null;
}

export async function persistAuthSession(session: AuthSession): Promise<void> {
  const serializedSession = JSON.stringify(session);

  if (Platform.OS === "web") {
    getWebStorage()?.setItem(AUTH_SESSION_STORAGE_KEY, serializedSession);
    return;
  }

  if (await SecureStore.isAvailableAsync()) {
    await SecureStore.setItemAsync(AUTH_SESSION_STORAGE_KEY, serializedSession);
  }
}

export async function clearPersistedAuthSession(): Promise<void> {
  if (Platform.OS === "web") {
    getWebStorage()?.removeItem(AUTH_SESSION_STORAGE_KEY);
    return;
  }

  if (await SecureStore.isAvailableAsync()) {
    await SecureStore.deleteItemAsync(AUTH_SESSION_STORAGE_KEY);
  }
}
