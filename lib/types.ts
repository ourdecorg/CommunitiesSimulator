// ─── Domain types ────────────────────────────────────────────────────────────

export type LocalLinkStatus =
  | "not_linked"
  | "initiated"
  | "opened_link"
  | "assumed_linked"
  | "error";

export interface CommunityUser {
  id: string;
  community_user_id: string;
  display_name: string;
  email: string;
  server_id: string;
  local_link_status: LocalLinkStatus;
  created_at: string;
  updated_at: string;
}

export type LocalAttemptStatus =
  | "success"
  | "failed"
  | "expired"
  | "already_linked"
  | "unknown";

export interface LinkAttempt {
  id: string;
  community_user_id: string;
  display_name_snapshot: string;
  email_snapshot: string;
  server_id_snapshot: string;
  request_timestamp: string;
  nonce: string;
  canonical_body: string;
  signature: string;
  request_headers_json: string;
  request_body_json: string;
  response_status_code: number | null;
  response_body_json: string | null;
  handshake_token: string | null;
  link_url: string | null;
  expires_at: string | null;
  local_attempt_status: LocalAttemptStatus;
  created_at: string;
}

// ─── WoW API types ────────────────────────────────────────────────────────────

export interface WoWInitiateRequestBody {
  community_user_id: string;
  server_id: string;
  email: string;
  display_name?: string;
  timestamp: string;
  nonce: string;
}

export interface WoWInitiateResponse {
  status: string;
  handshake_token?: string;
  link_url?: string;
  expires_at?: string;
  error?: string;
  message?: string;
}

// ─── Client result ────────────────────────────────────────────────────────────

export interface SigningDiagnostics {
  canonicalBody: string;
  message: string;
  signature: string;
}

export interface InitiateResult {
  success: boolean;
  statusCode: number | null;
  parsedBody: WoWInitiateResponse | null;
  diagnostics: SigningDiagnostics;
  requestHeaders: Record<string, string>;
  requestBody: WoWInitiateRequestBody;
  error?: string;
}

// ─── Known WoW error codes ────────────────────────────────────────────────────

export const WOW_ERROR_MESSAGES: Record<string, string> = {
  INVALID_PAYLOAD: "The request body is malformed or missing required fields.",
  EXPIRED_REQUEST: "The request timestamp is too old. Check server clock sync.",
  INVALID_CLIENT_KEY: "The community client key is not recognised by WoW.",
  INVALID_SIGNATURE:
    "HMAC signature does not match. Check the shared secret and canonical body construction.",
  ALREADY_LINKED: "This community user is already linked to a WoW account.",
  NONCE_ALREADY_USED:
    "This nonce was used in a previous request (replay attack detected).",
  INTERNAL_ERROR: "WoW experienced an internal server error. Try again later.",
};
