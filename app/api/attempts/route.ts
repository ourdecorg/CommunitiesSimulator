import { NextRequest, NextResponse } from "next/server";
import { getAllAttempts } from "@/lib/storage/attempts";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  const status = searchParams.get("status");
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  let attempts = getAllAttempts();

  if (userId) {
    attempts = attempts.filter((a) => a.community_user_id === userId);
  }
  if (status) {
    attempts = attempts.filter((a) => a.local_attempt_status === status);
  }
  if (from) {
    const fromDate = new Date(from);
    attempts = attempts.filter((a) => new Date(a.created_at) >= fromDate);
  }
  if (to) {
    const toDate = new Date(to);
    attempts = attempts.filter((a) => new Date(a.created_at) <= toDate);
  }

  return NextResponse.json(attempts);
}
