import { NextRequest, NextResponse } from "next/server";
import { getUserById, setUserLinkStatus } from "@/lib/storage/users";
import { createAttempt } from "@/lib/storage/attempts";
import { initiateLink } from "@/lib/wow/client";
import { resolveAttemptStatus, resolveUserStatusAfterAttempt } from "@/lib/utils";

export async function POST(req: NextRequest) {
  const { userId } = await req.json();
  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  const user = getUserById(userId);
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const result = await initiateLink({
    community_user_id: user.community_user_id,
    server_id: user.server_id,
    email: user.email,
    display_name: user.display_name || undefined,
  });

  const attemptStatus = resolveAttemptStatus(result.statusCode, result.parsedBody);
  const userStatus = resolveUserStatusAfterAttempt(attemptStatus);

  const attempt = createAttempt({
    community_user_id: user.community_user_id,
    display_name_snapshot: user.display_name,
    email_snapshot: user.email,
    server_id_snapshot: user.server_id,
    request_timestamp: result.requestBody.timestamp,
    nonce: result.requestBody.nonce,
    canonical_body: result.diagnostics.canonicalBody,
    signature: result.diagnostics.signature,
    request_headers_json: JSON.stringify(result.requestHeaders),
    request_body_json: JSON.stringify(result.requestBody),
    response_status_code: result.statusCode,
    response_body_json: result.parsedBody ? JSON.stringify(result.parsedBody) : null,
    handshake_token: result.parsedBody?.handshake_token ?? null,
    link_url: result.parsedBody?.link_url ?? null,
    expires_at: result.parsedBody?.expires_at ?? null,
    local_attempt_status: attemptStatus,
  });

  if (attemptStatus !== "unknown") {
    setUserLinkStatus(user.id, userStatus);
  }

  return NextResponse.json({ attempt, result });
}
