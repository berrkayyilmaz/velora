import { type PropsWithChildren, useMemo, useState } from "react";

import {
  AdminAuthContext,
  type AdminAuthContextValue
} from "@/store/admin-auth.context";
import type { AdminSession } from "@/types/admin-auth";

export function AdminAuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<AdminSession | null>(null);
  const value = useMemo<AdminAuthContextValue>(
    () => ({
      session,
      isAuthenticated: session !== null,
      setSession,
      clearSession: () => setSession(null)
    }),
    [session]
  );

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}
