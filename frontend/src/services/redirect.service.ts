import { apiClient } from "@/services/api/client";
import type {
  CreateRetailerRedirectInput,
  RetailerRedirect,
  RetailerRedirectResponse
} from "@/types/redirect";

export async function createRetailerRedirect(
  input: CreateRetailerRedirectInput
): Promise<RetailerRedirect> {
  const response = await apiClient.post<RetailerRedirectResponse>("/redirects", input);

  return response.data.data;
}
