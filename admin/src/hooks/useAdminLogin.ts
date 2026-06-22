import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

import { loginAdmin } from "@/services/admin-auth.service";
import { useAdminAuth } from "@/store/useAdminAuth";

export function useAdminLogin() {
  const navigate = useNavigate();
  const { setSession } = useAdminAuth();

  return useMutation({
    mutationFn: loginAdmin,
    onSuccess: (session) => {
      setSession(session);
      navigate("/", { replace: true });
    }
  });
}
