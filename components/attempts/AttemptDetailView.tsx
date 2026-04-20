import type { LinkAttempt } from "@/lib/types";
import { AttemptStatusBadge, HttpStatusBadge } from "@/components/ui/Badge";
import CodeBlock from "@/components/ui/CodeBlock";
import { isExpired, formatDate } from "@/lib/utils";

export default function AttemptDetailView({ attempt }: { attempt: LinkAttempt }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-xs text-slate-500">User ID</p>
          <p className="font-mono text-xs">{attempt.community_user_id}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Display Name</p>
          <p>{attempt.display_name_snapshot}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Email</p>
          <p>{attempt.email_snapshot}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Server</p>
          <p>{attempt.server_id_snapshot}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Status</p>
          <AttemptStatusBadge status={attempt.local_attempt_status} />
        </div>
        <div>
          <p className="text-xs text-slate-500">HTTP Code</p>
          <HttpStatusBadge code={attempt.response_status_code} />
        </div>
        <div>
          <p className="text-xs text-slate-500">Created</p>
          <p className="text-xs">{formatDate(attempt.created_at)}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Nonce</p>
          <p className="font-mono text-xs break-all">{attempt.nonce}</p>
        </div>
        {attempt.handshake_token && (
          <div className="col-span-2">
            <p className="text-xs text-slate-500">Handshake Token</p>
            <p className="font-mono text-xs break-all">{attempt.handshake_token}</p>
          </div>
        )}
        {attempt.link_url && (
          <div className="col-span-2">
            <p className="text-xs text-slate-500">Link URL</p>
            <div className="flex items-center gap-2">
              <p className="font-mono text-xs break-all text-blue-600">{attempt.link_url}</p>
              {isExpired(attempt.expires_at) && (
                <span className="text-xs text-red-500 font-medium shrink-0">EXPIRED</span>
              )}
            </div>
          </div>
        )}
      </div>
      <CodeBlock label="Canonical Body" value={attempt.canonical_body} />
      <CodeBlock label="Signature" value={attempt.signature} maxHeight="60px" />
      <CodeBlock label="Request Headers" value={attempt.request_headers_json} />
      <CodeBlock label="Request Body" value={attempt.request_body_json} />
      <CodeBlock label="Response Body" value={attempt.response_body_json ?? "null"} />
    </div>
  );
}
