import { apiClient } from "@/services/api/client";
import type {
  AnalyticsEventResponse,
  CreateAnalyticsEventInput
} from "@/types/analytics";

export async function createAnalyticsEvent(
  input: CreateAnalyticsEventInput
): Promise<void> {
  await apiClient.post<AnalyticsEventResponse>("/analytics/events", input);
}
