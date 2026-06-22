import { useMutation } from "@tanstack/react-query";
import { useRouter } from "expo-router";

import type { LoginFormValues, RegisterFormValues } from "@/schemas/auth.schemas";
import { login, register } from "@/services/auth.service";
import { useAuthStore } from "@/store/auth.store";

export function useLoginMutation() {
  const router = useRouter();
  const setSession = useAuthStore((state) => state.setSession);

  return useMutation({
    mutationFn: (values: LoginFormValues) => login(values),
    onSuccess: async (session) => {
      await setSession(session);
      router.replace("/(tabs)/products");
    }
  });
}

export function useRegisterMutation() {
  const router = useRouter();
  const setSession = useAuthStore((state) => state.setSession);

  return useMutation({
    mutationFn: (values: RegisterFormValues) => register(values),
    onSuccess: async (session) => {
      await setSession(session);
      router.replace("/(tabs)/products");
    }
  });
}
