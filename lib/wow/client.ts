import { randomBytes } from "crypto";
import { signRequest } from "./signing";
import type {
  InitiateResult,
  WoWInitiateRequestBody,
  WoWInitiateResponse,
} from "@/lib/types";

interface InitiateOptions {
  /** Override the generated timestamp (for debug/testing). */
  overrideTimestamp?: string;
  /** Override the generated nonce (for replay testing). */
  overrideNonce?: string;
  /** Override the computed signature (for invalid-sig testing). */
  overrideSignature?: string;
}

function getEnv(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`Missing required environment variable: ${key}`);
  return val;
}

export async function initiateLink(
  user: {
    community_user_id: string;
    server_id: string;
    email: string;
    display_name?: string;
  },
  options: InitiateOptions = {}
): Promise<InitiateResult> {
  const baseUrl = getEnv("WOW_BASE_URL");
  const clientKey = getEnv("COMMUNITY_LINK_CLIENT_KEY");
  const sharedSecret = getEnv("COMMUNITY_LINK_SHARED_SECRET");

  const timestamp =
    options.overrideTimestamp ?? new Date().toISOString();
  const nonce =
    options.overrideNonce ?? randomBytes(16).toString("hex");

  const body: WoWInitiateRequestBody = {
    community_user_id: user.community_user_id,
    server_id: user.server_id,
    email: user.email,
    display_name: user.display_name,
    timestamp,
    nonce,
  };

  // Remove undefined display_name so it doesn't appear in canonical body
  if (body.display_name === undefined) {
    delete body.display_name;
  }

  const { canonicalBody, message, signature: computedSignature } =
    signRequest(body, timestamp, nonce, sharedSecret);

  const signature = options.overrideSignature ?? computedSignature;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Community-Key": clientKey,
    "X-Timestamp": timestamp,
    "X-Nonce": nonce,
    "X-Signature": signature,
  };

  let statusCode: number | null = null;
  let parsedBody: WoWInitiateResponse | null = null;
  let error: string | undefined;

  const url = `${baseUrl}/api/community-links/initiate`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    statusCode = response.status;

    try {
      parsedBody = (await response.json()) as WoWInitiateResponse;
    } catch {
      parsedBody = null;
    }
  } catch (err) {
    // Node fetch throws TypeError("fetch failed") with a nested cause for network errors.
    // Unwrap it so the UI shows something actionable (e.g. ENOTFOUND, ECONNREFUSED).
    if (err instanceof TypeError && err.cause instanceof Error) {
      error = `Network error reaching ${url} — ${err.cause.message}`;
    } else {
      error = `Network error reaching ${url} — ${err instanceof Error ? err.message : String(err)}`;
    }
  }

  return {
    success: statusCode !== null && statusCode >= 200 && statusCode < 300,
    statusCode,
    parsedBody,
    diagnostics: { canonicalBody, message, signature },
    requestHeaders: headers,
    requestBody: body,
    error,
  };
}
