import { create } from "zustand";

import {
  clearPersistedAuthSession,
  getPersistedAuthSession,
  persistAuthSession
} from "@/services/auth-session.storage";
import type { AuthSession } from "@/types/auth";

type AuthState = {
  session: AuthSession | null;
  hasHydrated: boolean;
  hydrateSession: () => Promise<void>;
  setSession: (session: AuthSession) => Promise<void>;
  clearSession: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  hasHydrated: false,
  hydrateSession: async () => {
    try {
      const session = await getPersistedAuthSession();
      set({ session });
    } finally {
      set({ hasHydrated: true });
    }
  },
  setSession: async (session) => {
    await persistAuthSession(session);
    set({ session });
  },
  clearSession: async () => {
    set({ session: null });
    await clearPersistedAuthSession();
  }
}));
