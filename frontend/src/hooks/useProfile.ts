import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";

import { getProfile, updateProfile } from "@/services/profile.service";
import { useAuthStore } from "@/store/auth.store";

export const profileQueryKeys = {
  all: ["profile"] as const,
  current: () => [...profileQueryKeys.all, "current"] as const
};

export function useProfile() {
  return useQuery({
    queryKey: profileQueryKeys.current(),
    queryFn: getProfile
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const setSession = useAuthStore((state) => state.setSession);

  return useMutation({
    mutationFn: updateProfile,
    onSuccess: (profile) => {
      queryClient.setQueryData(profileQueryKeys.current(), profile);

      const session = useAuthStore.getState().session;

      if (session !== null) {
        setSession({
          ...session,
          user: profile
        });
      }
    }
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const clearSession = useAuthStore((state) => state.clearSession);

  return () => {
    queryClient.clear();
    clearSession();
    router.replace("/sign-in");
  };
}
