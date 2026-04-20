import { NextResponse } from "next/server";
import { getAllAttempts } from "@/lib/storage/attempts";

export async function GET() {
  const attempts = getAllAttempts();

  const headers = [
    "id",
    "community_user_id",
    "display_name_snapshot",
    "email_snapshot",
    "server_id_snapshot",
    "request_timestamp",
    "nonce",
    "response_status_code",
    "handshake_token",
    "link_url",
    "expires_at",
    "local_attempt_status",
    "created_at",
  ];

  const rows = attempts.map((a) =>
    headers
      .map((h) => {
        const val = a[h as keyof typeof a] ?? "";
        const str = String(val);
        return str.includes(",") || str.includes('"') || str.includes("\n")
          ? `"${str.replace(/"/g, '""')}"`
          : str;
      })
      .join(",")
  );

  const csv = [headers.join(","), ...rows].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="link-attempts-${Date.now()}.csv"`,
    },
  });
}
