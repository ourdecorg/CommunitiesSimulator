import { randomUUID } from "crypto";
import { readCollection, writeCollection } from "./db";
import type { CommunityUser, LocalLinkStatus } from "@/lib/types";

const COLLECTION = "users";

export function getAllUsers(): CommunityUser[] {
  return readCollection<CommunityUser>(COLLECTION);
}

export function getUserById(id: string): CommunityUser | null {
  return getAllUsers().find((u) => u.id === id) ?? null;
}

export function createUser(
  data: Omit<CommunityUser, "id" | "local_link_status" | "created_at" | "updated_at">
): CommunityUser {
  const now = new Date().toISOString();
  const user: CommunityUser = {
    ...data,
    id: randomUUID(),
    local_link_status: "not_linked",
    created_at: now,
    updated_at: now,
  };
  const users = getAllUsers();
  users.push(user);
  writeCollection(COLLECTION, users);
  return user;
}

export function updateUser(
  id: string,
  data: Partial<Omit<CommunityUser, "id" | "created_at">>
): CommunityUser | null {
  const users = getAllUsers();
  const idx = users.findIndex((u) => u.id === id);
  if (idx === -1) return null;
  users[idx] = { ...users[idx], ...data, updated_at: new Date().toISOString() };
  writeCollection(COLLECTION, users);
  return users[idx];
}

export function setUserLinkStatus(id: string, status: LocalLinkStatus): void {
  updateUser(id, { local_link_status: status });
}

export function deleteUser(id: string): boolean {
  const users = getAllUsers();
  const filtered = users.filter((u) => u.id !== id);
  if (filtered.length === users.length) return false;
  writeCollection(COLLECTION, filtered);
  return true;
}

export function seedUsers(): void {
  const existing = getAllUsers();
  if (existing.length > 0) return;

  const serverId =
    process.env.DEFAULT_SERVER_ID ?? "community-server-1";

  const seeds: Omit<
    CommunityUser,
    "id" | "local_link_status" | "created_at" | "updated_at"
  >[] = [
    {
      community_user_id: "usr_001",
      display_name: "Alice Wonderland",
      email: "alice@example.com",
      server_id: serverId,
    },
    {
      community_user_id: "usr_002",
      display_name: "Bob Builder",
      email: "bob@example.com",
      server_id: serverId,
    },
    {
      community_user_id: "usr_003",
      display_name: "Carol Singer",
      email: "carol@example.com",
      server_id: serverId,
    },
    {
      community_user_id: "usr_004",
      display_name: "David Copperfield",
      email: "david@example.com",
      server_id: serverId,
    },
    {
      community_user_id: "usr_005",
      display_name: "Eve Adams",
      email: "eve@example.com",
      server_id: "community-server-2",
    },
    {
      community_user_id: "usr_006",
      display_name: "Frank Castle",
      email: "frank@example.com",
      server_id: serverId,
    },
    {
      community_user_id: "usr_007",
      display_name: "Grace Hopper",
      email: "grace@example.com",
      server_id: serverId,
    },
    {
      community_user_id: "usr_008",
      display_name: "Hank Pym",
      email: "hank@example.com",
      server_id: "community-server-2",
    },
    {
      community_user_id: "usr_009",
      display_name: "Iris West",
      email: "iris@example.com",
      server_id: serverId,
    },
    {
      community_user_id: "usr_010",
      display_name: "Jack Sparrow",
      email: "jack@example.com",
      server_id: serverId,
    },
  ];

  for (const seed of seeds) {
    createUser(seed);
  }
}
