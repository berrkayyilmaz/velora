import { Navigate, Outlet, useLocation } from "react-router-dom";

import { useAdminAuth } from "@/store/useAdminAuth";

export function ProtectedRoute() {
  const { isAuthenticated } = useAdminAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate replace state={{ from: location.pathname }} to="/login" />;
  }

  return <Outlet />;
}
