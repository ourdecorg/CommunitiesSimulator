import { NextRequest, NextResponse } from "next/server";
import { getUserById } from "@/lib/storage/users";
import { createAttempt } from "@/lib/storage/attempts";
import { initiateLink } from "@/lib/wow/client";
import { resolveAttemptStatus } from "@/lib/utils";

export async function POST(req: NextRequest) {
  const { userId } = await req.json();
  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

  const user = getUserById(userId);
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  // Send a deliberately broken signature
  const result = await initiateLink(
    {
      community_user_id: user.community_user_id,
      server_id: user.server_id,
      email: user.email,
      display_name: user.display_name || undefined,
    },
    { overrideSignature: "00000000000000000000000000000000_INVALID_SIGNATURE" }
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

  return NextResponse.json({ attempt, result, debug: "invalid_signature" });
}
