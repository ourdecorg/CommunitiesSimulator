import { NextRequest, NextResponse } from "next/server";
import { getAttemptById } from "@/lib/storage/attempts";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const attempt = getAttemptById(params.id);
  if (!attempt) {
    return NextResponse.json({ error: "Attempt not found" }, { status: 404 });
  }
  return NextResponse.json(attempt);
}
