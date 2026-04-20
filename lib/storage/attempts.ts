import { randomUUID } from "crypto";
import { readCollection, writeCollection } from "./db";
import type { LinkAttempt, LocalAttemptStatus } from "@/lib/types";

const COLLECTION = "attempts";

export function getAllAttempts(): LinkAttempt[] {
  return readCollection<LinkAttempt>(COLLECTION).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

export function getAttemptById(id: string): LinkAttempt | null {
  return readCollection<LinkAttempt>(COLLECTION).find((a) => a.id === id) ?? null;
}

export function getAttemptsByUser(communityUserId: string): LinkAttempt[] {
  return getAllAttempts().filter(
    (a) => a.community_user_id === communityUserId
  );
}

export function createAttempt(
  data: Omit<LinkAttempt, "id" | "created_at">
): LinkAttempt {
  const attempt: LinkAttempt = {
    ...data,
    id: randomUUID(),
    created_at: new Date().toISOString(),
  };
  const attempts = readCollection<LinkAttempt>(COLLECTION);
  attempts.push(attempt);
  writeCollection(COLLECTION, attempts);
  return attempt;
}

export function updateAttemptStatus(
  id: string,
  status: LocalAttemptStatus
): void {
  const attempts = readCollection<LinkAttempt>(COLLECTION);
  const idx = attempts.findIndex((a) => a.id === id);
  if (idx !== -1) {
    attempts[idx].local_attempt_status = status;
    writeCollection(COLLECTION, attempts);
  }
}
