import type { AdminSession, AdminUser } from "@/types/admin-auth";

const ADMIN_SESSION_STORAGE_KEY = "velora.admin.session";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isAdminUser(value: unknown): value is AdminUser {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.email === "string" &&
    typeof value.createdAt === "string" &&
    typeof value.updatedAt === "string"
  );
}

function isAdminSession(value: unknown): value is AdminSession {
  return (
    isRecord(value) &&
    typeof value.authToken === "string" &&
    value.authToken.length > 0 &&
    isAdminUser(value.adminUser)
  );
}

export function getPersistedAdminSession(): AdminSession | null {
  try {
    const storedSession = window.localStorage.getItem(ADMIN_SESSION_STORAGE_KEY);

    if (storedSession === null) {
      return null;
    }

    const parsedSession: unknown = JSON.parse(storedSession);

    if (isAdminSession(parsedSession)) {
      return parsedSession;
    }
  } catch {
    // Invalid or unavailable browser storage is treated as an empty session.
  }

  clearPersistedAdminSession();
  return null;
}

export function persistAdminSession(session: AdminSession): void {
  try {
    window.localStorage.setItem(ADMIN_SESSION_STORAGE_KEY, JSON.stringify(session));
  } catch {
    // In-memory authentication remains usable if browser storage is unavailable.
  }
}

export function clearPersistedAdminSession(): void {
  try {
    window.localStorage.removeItem(ADMIN_SESSION_STORAGE_KEY);
  } catch {
    // The in-memory session is still cleared by the auth provider.
  }
}
