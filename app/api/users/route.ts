import { NextRequest, NextResponse } from "next/server";
import { getAllUsers, createUser, seedUsers } from "@/lib/storage/users";

export async function GET() {
  seedUsers();
  return NextResponse.json(getAllUsers());
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { community_user_id, display_name, email, server_id } = body;

  if (!community_user_id || !email || !server_id) {
    return NextResponse.json(
      { error: "community_user_id, email, and server_id are required" },
      { status: 400 }
    );
  }

  const user = createUser({ community_user_id, display_name: display_name ?? "", email, server_id });
  return NextResponse.json(user, { status: 201 });
}
