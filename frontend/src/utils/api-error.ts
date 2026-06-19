import { isAxiosError } from "axios";
import { z } from "zod";

const apiErrorResponseSchema = z.object({
  error: z.object({
    message: z.string()
  })
});

export function getApiErrorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    const parsedResponse = apiErrorResponseSchema.safeParse(error.response?.data);

    if (parsedResponse.success) {
      return parsedResponse.data.error.message;
    }

    if (error.response === undefined) {
      return "Unable to reach the server. Check your connection and try again.";
    }
  }

  return "Something went wrong. Please try again.";
}
