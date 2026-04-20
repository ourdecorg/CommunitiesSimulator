import { NextRequest, NextResponse } from "next/server";
import {
  getUserById,
  updateUser,
  deleteUser,
  createUser,
} from "@/lib/storage/users";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = getUserById(params.id);
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
  return NextResponse.json(user);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await req.json();
  const updated = updateUser(params.id, body);
  if (!updated) return NextResponse.json({ error: "User not found" }, { status: 404 });
  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const deleted = deleteUser(params.id);
  if (!deleted) return NextResponse.json({ error: "User not found" }, { status: 404 });
  return NextResponse.json({ success: true });
}

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  // Duplicate user shortcut
  const user = getUserById(params.id);
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const copy = createUser({
    community_user_id: `${user.community_user_id}_copy_${Date.now()}`,
    display_name: `${user.display_name} (copy)`,
    email: `copy_${Date.now()}_${user.email}`,
    server_id: user.server_id,
  });
  return NextResponse.json(copy, { status: 201 });
}
