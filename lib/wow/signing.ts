import { createHmac } from "crypto";

export interface SigningResult {
  canonicalBody: string;
  message: string;
  signature: string;
}

/**
 * Recursively sorts object keys alphabetically so the canonical JSON
 * representation is deterministic regardless of insertion order.
 */
function sortObjectKeys(obj: unknown): unknown {
  if (Array.isArray(obj)) {
    return obj.map(sortObjectKeys);
  }
  if (obj !== null && typeof obj === "object") {
    const sorted: Record<string, unknown> = {};
    for (const key of Object.keys(obj as Record<string, unknown>).sort()) {
      sorted[key] = sortObjectKeys((obj as Record<string, unknown>)[key]);
    }
    return sorted;
  }
  return obj;
}

/** Produces compact JSON with alphabetically-sorted keys. */
export function canonicalJSON(body: unknown): string {
  return JSON.stringify(sortObjectKeys(body));
}

/**
 * Signs a request body using HMAC-SHA256.
 *
 * message = timestamp + "\n" + nonce + "\n" + canonicalBody
 */
export function signRequest(
  body: unknown,
  timestamp: string,
  nonce: string,
  sharedSecret: string
): SigningResult {
  const canonicalBody = canonicalJSON(body);
  const message = `${timestamp}\n${nonce}\n${canonicalBody}`;
  const signature = createHmac("sha256", sharedSecret)
    .update(message)
    .digest("hex");

  return { canonicalBody, message, signature };
}
