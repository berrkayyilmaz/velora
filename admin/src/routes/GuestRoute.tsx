import { Navigate, Outlet } from "react-router-dom";

import { useAdminAuth } from "@/store/useAdminAuth";

export function GuestRoute() {
  const { hasHydrated, isAuthenticated } = useAdminAuth();

  if (!hasHydrated) {
    return null;
  }

  if (isAuthenticated) {
    return <Navigate replace to="/" />;
  }

  return <Outlet />;
}
