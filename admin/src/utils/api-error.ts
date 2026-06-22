import { isAxiosError } from "axios";

type ApiErrorResponse = {
  error?: {
    message?: unknown;
  };
};

export function getApiErrorMessage(error: unknown): string {
  if (isAxiosError<ApiErrorResponse>(error)) {
    const message = error.response?.data.error?.message;

    if (typeof message === "string" && message.length > 0) {
      return message;
    }

    if (error.response === undefined) {
      return "Unable to reach the server. Check your connection and try again.";
    }
  }

  return "Something went wrong. Please try again.";
}
