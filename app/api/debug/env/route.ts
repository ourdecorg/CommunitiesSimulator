import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { signRequest } from "@/lib/wow/signing";

export async function GET() {
  const wowBaseUrl = process.env.WOW_BASE_URL ?? null;
  const clientKey = process.env.COMMUNITY_LINK_CLIENT_KEY ?? null;
  const sharedSecret = process.env.COMMUNITY_LINK_SHARED_SECRET ?? null;
  const serverId = process.env.DEFAULT_SERVER_ID ?? null;

  const timestamp = new Date().toISOString();
  const nonce = randomBytes(16).toString("hex");
  const sampleBody = {
    community_user_id: "sample_user_001",
    email: "sample@example.com",
    nonce,
    server_id: serverId ?? "sample-server",
    timestamp,
  };

  let signingPreview = null;
  if (sharedSecret) {
    const result = signRequest(sampleBody, timestamp, nonce, sharedSecret);
    signingPreview = {
      canonicalBody: result.canonicalBody,
      message: result.message,
      signature: result.signature,
    };
  }

  return NextResponse.json({
    env: {
      WOW_BASE_URL: { set: !!wowBaseUrl, value: wowBaseUrl },
      COMMUNITY_LINK_CLIENT_KEY: { set: !!clientKey, value: clientKey },
      COMMUNITY_LINK_SHARED_SECRET: {
        set: !!sharedSecret,
        // Never expose the actual secret; show only whether it's set and its length
        hint: sharedSecret ? `[set, ${sharedSecret.length} chars]` : null,
      },
      DEFAULT_SERVER_ID: { set: !!serverId, value: serverId },
    },
    preview: {
      timestamp,
      nonce,
      sampleBody,
      signingPreview,
    },
  });
}
