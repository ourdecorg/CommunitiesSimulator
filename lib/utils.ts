import type { LocalAttemptStatus, LocalLinkStatus, WoWInitiateResponse } from "./types";

export function resolveAttemptStatus(
  statusCode: number | null,
  body: WoWInitiateResponse | null
): LocalAttemptStatus {
  // Error responses from WoW use { "error": "CODE" }, not { "status": "CODE" }
  if (statusCode === null) return "unknown";
  if (statusCode >= 200 && statusCode < 300) return "success";
  if (statusCode === 409 && body?.error === "ALREADY_LINKED") return "already_linked";
  if (statusCode === 400 && body?.error === "EXPIRED_REQUEST") return "expired";
  return "failed";
}

export function resolveUserStatusAfterAttempt(
  attemptStatus: LocalAttemptStatus
): LocalLinkStatus {
  switch (attemptStatus) {
    case "success":
      return "initiated";
    case "already_linked":
      return "assumed_linked";
    case "failed":
    case "unknown":
      return "error";
    default:
      return "error";
  }
}

export function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function isExpired(expiresAt: string | null): boolean {
  if (!expiresAt) return false;
  return new Date(expiresAt) < new Date();
}
