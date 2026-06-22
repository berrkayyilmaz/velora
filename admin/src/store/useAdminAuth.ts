import { useContext } from "react";

import { AdminAuthContext, type AdminAuthContextValue } from "@/store/admin-auth.context";

export function useAdminAuth(): AdminAuthContextValue {
  const context = useContext(AdminAuthContext);

  if (context === null) {
    throw new Error("useAdminAuth must be used within AdminAuthProvider.");
  }

  return context;
}
