import { adminApiClient } from "@/services/api/client";
import type {
  AdminLoginInput,
  AdminMeResponse,
  AdminSession,
  AdminSessionResponse,
  AdminUser
} from "@/types/admin-auth";

export async function loginAdmin(input: AdminLoginInput): Promise<AdminSession> {
  const response = await adminApiClient.post<AdminSessionResponse>("/admin/auth/login", input);

  return response.data.data;
}

export async function getAdminProfile(): Promise<AdminUser> {
  const response = await adminApiClient.get<AdminMeResponse>("/admin/me");

  return response.data.data.adminUser;
}
