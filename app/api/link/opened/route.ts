import { NextRequest, NextResponse } from "next/server";
import { getUserById, setUserLinkStatus } from "@/lib/storage/users";
import { getAttemptById } from "@/lib/storage/attempts";

export async function POST(req: NextRequest) {
  const { userId, attemptId } = await req.json();

  if (userId) {
    const user = getUserById(userId);
    if (user && user.local_link_status === "initiated") {
      setUserLinkStatus(user.id, "opened_link");
    }
  }

  if (attemptId) {
    const attempt = getAttemptById(attemptId);
    if (!attempt) {
      return NextResponse.json({ error: "Attempt not found" }, { status: 404 });
    }
  }

  return NextResponse.json({ success: true });
}
