import { NextRequest, NextResponse } from "next/server";
import { getUserById } from "@/lib/storage/users";
import { createAttempt, getAttemptsByUser } from "@/lib/storage/attempts";
import { initiateLink } from "@/lib/wow/client";
import { resolveAttemptStatus } from "@/lib/utils";

export async function POST(req: NextRequest) {
  const { userId } = await req.json();
  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

  const user = getUserById(userId);
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  // Find the most recent nonce used for this user, or use a static one
  const previousAttempts = getAttemptsByUser(user.community_user_id);
  const reuseNonce =
    previousAttempts.length > 0
      ? previousAttempts[0].nonce
      : "replay-test-nonce-00000000";

  const result = await initiateLink(
    {
      community_user_id: user.community_user_id,
      server_id: user.server_id,
      email: user.email,
      display_name: user.display_name || undefined,
    },
    { overrideNonce: reuseNonce }
  );

  const attemptStatus = resolveAttemptStatus(result.statusCode, result.parsedBody);
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
    handshake_token: null,
    link_url: null,
    expires_at: null,
    local_attempt_status: attemptStatus,
  });

  return NextResponse.json({
    attempt,
    result,
    debug: "reused_nonce",
    reusedNonce: reuseNonce,
  });
}
