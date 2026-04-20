import { NextResponse } from "next/server";
import { writeCollection } from "@/lib/storage/db";
import { seedUsers } from "@/lib/storage/users";

export async function POST() {
  writeCollection("users", []);
  writeCollection("attempts", []);
  seedUsers();
  return NextResponse.json({ success: true, message: "Data reset and re-seeded" });
}
