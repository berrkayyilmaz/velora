function getApiBaseUrl(): string {
  const value = import.meta.env.VITE_API_BASE_URL;

  if (typeof value !== "string" || value.trim() === "") {
    throw new Error("VITE_API_BASE_URL is required.");
  }

  const url = new URL(value);

  if (!url.pathname.endsWith("/api/v1")) {
    throw new Error("VITE_API_BASE_URL must include the /api/v1 base path.");
  }

  return value.replace(/\/$/, "");
}

export const env = {
  apiBaseUrl: getApiBaseUrl()
} as const;
