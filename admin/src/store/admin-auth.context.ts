import { createContext } from "react";

import type { AdminSession } from "@/types/admin-auth";

export type AdminAuthContextValue = {
  session: AdminSession | null;
  isAuthenticated: boolean;
  hasHydrated: boolean;
  setSession: (session: AdminSession) => void;
  clearSession: () => void;
};

export const AdminAuthContext = createContext<AdminAuthContextValue | null>(null);
