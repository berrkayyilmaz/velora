import { apiClient } from "@/services/api/client";
import type { UserProfile } from "@/types/auth";

type ProfileResponse = {
  data: UserProfile;
};

export type UpdateProfileInput = {
  displayName: string | null;
};

export async function getProfile(): Promise<UserProfile> {
  const response = await apiClient.get<ProfileResponse>("/me");

  return response.data.data;
}

export async function updateProfile(input: UpdateProfileInput): Promise<UserProfile> {
  const response = await apiClient.patch<ProfileResponse>("/me", input);

  return response.data.data;
}
