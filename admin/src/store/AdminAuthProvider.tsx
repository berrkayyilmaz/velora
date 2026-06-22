import {
  type PropsWithChildren,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";

import { queryClient } from "@/config/query-client";
import { getAdminProfile } from "@/services/admin-auth.service";
import {
  clearPersistedAdminSession,
  getPersistedAdminSession,
  persistAdminSession
} from "@/services/admin-session.storage";
import { configureAdminApiAuth } from "@/services/api/client";
import {
  AdminAuthContext,
  type AdminAuthContextValue
} from "@/store/admin-auth.context";
import type { AdminSession } from "@/types/admin-auth";

export function AdminAuthProvider({ children }: PropsWithChildren) {
  const [initialSession] = useState(getPersistedAdminSession);
  const [session, setSession] = useState<AdminSession | null>(initialSession);
  const [hasHydrated, setHasHydrated] = useState(initialSession === null);
  const sessionRef = useRef<AdminSession | null>(initialSession);
  const hydrationStarted = useRef(false);

  const updateSession = useCallback((nextSession: AdminSession) => {
    sessionRef.current = nextSession;
    persistAdminSession(nextSession);
    setSession(nextSession);
  }, []);

  const clearSession = useCallback(() => {
    sessionRef.current = null;
    clearPersistedAdminSession();
    setSession(null);
  }, []);

  useEffect(
    () =>
      configureAdminApiAuth({
        getAccessToken: () => sessionRef.current?.authToken ?? null,
        onUnauthorized: () => {
          queryClient.getQueryCache().clear();
          clearSession();
        }
      }),
    [clearSession]
  );

  useEffect(() => {
    if (hydrationStarted.current) {
      return;
    }

    hydrationStarted.current = true;
    if (initialSession === null) {
      return;
    }

    void getAdminProfile()
      .then((adminUser) => {
        updateSession({
          ...initialSession,
          adminUser
        });
      })
      .catch(() => undefined)
      .finally(() => setHasHydrated(true));
  }, [initialSession, updateSession]);

  const value = useMemo<AdminAuthContextValue>(
    () => ({
      session,
      isAuthenticated: session !== null,
      hasHydrated,
      setSession: updateSession,
      clearSession
    }),
    [clearSession, hasHydrated, session, updateSession]
  );

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}
