function getApiBaseUrl(): string {
  const value = import.meta.env.VITE_API_BASE_URL;

  if (typeof value !== "string" || value.trim() === "") {
    throw new Error("VITE_API_BASE_URL is required.");
  }

  const normalizedValue = value.replace(/\/$/, "");

  if (normalizedValue.startsWith("/")) {
    if (!normalizedValue.endsWith("/api/v1")) {
      throw new Error("VITE_API_BASE_URL must include the /api/v1 base path.");
    }

    return normalizedValue;
  }

  const url = new URL(normalizedValue);

  if (!url.pathname.endsWith("/api/v1")) {
    throw new Error("VITE_API_BASE_URL must include the /api/v1 base path.");
  }

  return normalizedValue;
}

export const env = {
  apiBaseUrl: getApiBaseUrl()
} as const;
