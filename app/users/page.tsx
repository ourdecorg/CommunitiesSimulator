"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Copy,
  Zap,
  ExternalLink,
  ClipboardCopy,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import type { CommunityUser, LinkAttempt, InitiateResult } from "@/lib/types";
import { LinkStatusBadge, HttpStatusBadge, AttemptStatusBadge } from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import CodeBlock from "@/components/ui/CodeBlock";
import AttemptDetailView from "@/components/attempts/AttemptDetailView";
import { formatDate, isExpired } from "@/lib/utils";
import { WOW_ERROR_MESSAGES } from "@/lib/types";

type FormData = {
  community_user_id: string;
  display_name: string;
  email: string;
  server_id: string;
};

const EMPTY_FORM: FormData = {
  community_user_id: "",
  display_name: "",
  email: "",
  server_id: "",
};

export default function UsersPage() {
  const [users, setUsers] = useState<CommunityUser[]>([]);
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<CommunityUser | null>(null);
  const [formData, setFormData] = useState<FormData>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);

  const [linking, setLinking] = useState<string | null>(null);
  const [linkResult, setLinkResult] = useState<{
    userId: string;
    attempt: LinkAttempt;
    result: InitiateResult;
  } | null>(null);

  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [userAttempts, setUserAttempts] = useState<Record<string, LinkAttempt[]>>({});

  const loadUsers = useCallback(() => {
    fetch("/api/users")
      .then((r) => r.json())
      .then((d) => { setUsers(d); setLoading(false); });
  }, []);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  function openCreate() {
    setEditingUser(null);
    setFormData({ ...EMPTY_FORM, server_id: process.env.NEXT_PUBLIC_DEFAULT_SERVER_ID ?? "" });
    setFormError(null);
    setShowForm(true);
  }

  function openEdit(user: CommunityUser) {
    setEditingUser(user);
    setFormData({
      community_user_id: user.community_user_id,
      display_name: user.display_name,
      email: user.email,
      server_id: user.server_id,
    });
    setFormError(null);
    setShowForm(true);
  }

  async function saveUser() {
    if (!formData.community_user_id || !formData.email || !formData.server_id) {
      setFormError("community_user_id, email, and server_id are required.");
      return;
    }
    const url = editingUser ? `/api/users/${editingUser.id}` : "/api/users";
    const method = editingUser ? "PATCH" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });
    if (!res.ok) {
      const d = await res.json();
      setFormError(d.error ?? "Failed to save user");
      return;
    }
    setShowForm(false);
    loadUsers();
  }

  async function deleteUser(id: string, name: string) {
    if (!confirm(`Delete user "${name}"? This won't delete their attempt history.`)) return;
    await fetch(`/api/users/${id}`, { method: "DELETE" });
    loadUsers();
  }

  async function duplicateUser(id: string) {
    await fetch(`/api/users/${id}`, { method: "POST" });
    loadUsers();
  }

  async function linkUser(user: CommunityUser) {
    setLinking(user.id);
    const res = await fetch("/api/link/initiate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id }),
    });
    const data = await res.json();
    setLinking(null);
    setLinkResult({ userId: user.id, attempt: data.attempt, result: data.result });
    loadUsers();
  }

  async function markOpened(userId: string, attemptId: string) {
    await fetch("/api/link/opened", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, attemptId }),
    });
    loadUsers();
    if (linkResult && linkResult.userId === userId) {
      setLinkResult((prev) => prev ? {
        ...prev,
      } : null);
    }
  }

  async function toggleRow(userId: string, communityUserId: string) {
    if (expandedRow === userId) {
      setExpandedRow(null);
      return;
    }
    setExpandedRow(userId);
    if (!userAttempts[userId]) {
      const res = await fetch(`/api/attempts?userId=${communityUserId}`);
      const data = await res.json();
      setUserAttempts((prev) => ({ ...prev, [userId]: data }));
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Community Users</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {users.length} fake users · select one to test linking
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New User
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-slate-400">Loading…</p>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="text-left px-4 py-3 font-medium text-slate-600">User</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">ID</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Server</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Status</th>
                <th className="text-right px-4 py-3 font-medium text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <>
                  <tr
                    key={user.id}
                    className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-800">
                        {user.display_name || "—"}
                      </p>
                      <p className="text-xs text-slate-400">{user.email}</p>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">
                      {user.community_user_id}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {user.server_id}
                    </td>
                    <td className="px-4 py-3">
                      <LinkStatusBadge status={user.local_link_status} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => linkUser(user)}
                          disabled={linking === user.id}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
                        >
                          <Zap className="w-3 h-3" />
                          {linking === user.id ? "Linking…" : "Link to WoW"}
                        </button>
                        <button
                          onClick={() => toggleRow(user.id, user.community_user_id)}
                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors"
                          title="View attempts"
                        >
                          {expandedRow === user.id ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => openEdit(user)}
                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => duplicateUser(user.id)}
                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors"
                          title="Duplicate user"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteUser(user.id, user.display_name)}
                          className="p-1.5 text-red-400 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                  {expandedRow === user.id && (
                    <tr key={`${user.id}-expanded`} className="bg-slate-50">
                      <td colSpan={5} className="px-4 py-3">
                        <UserAttemptsInline
                          attempts={userAttempts[user.id] ?? []}
                          user={user}
                          onMarkOpened={markOpened}
                        />
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create/Edit modal */}
      {showForm && (
        <Modal
          title={editingUser ? "Edit User" : "New Community User"}
          onClose={() => setShowForm(false)}
        >
          <div className="space-y-4">
            <Field label="Community User ID *" hint="Unique ID within your community system">
              <input
                className="input"
                value={formData.community_user_id}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, community_user_id: e.target.value }))
                }
                placeholder="e.g. usr_123"
              />
            </Field>
            <Field label="Display Name">
              <input
                className="input"
                value={formData.display_name}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, display_name: e.target.value }))
                }
                placeholder="e.g. Alice Wonderland"
              />
            </Field>
            <Field label="Email *">
              <input
                className="input"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, email: e.target.value }))
                }
                placeholder="alice@example.com"
              />
            </Field>
            <Field label="Server ID *">
              <input
                className="input"
                value={formData.server_id}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, server_id: e.target.value }))
                }
                placeholder="community-server-1"
              />
            </Field>

            {formError && (
              <p className="text-sm text-red-600">{formError}</p>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowForm(false)}
                className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveUser}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {editingUser ? "Save Changes" : "Create User"}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Link result modal */}
      {linkResult && (
        <LinkResultModal
          attempt={linkResult.attempt}
          result={linkResult.result}
          userId={linkResult.userId}
          onMarkOpened={markOpened}
          onClose={() => setLinkResult(null)}
        />
      )}
    </div>
  );
}

// ─── Inline attempts for expanded row ────────────────────────────────────────

function UserAttemptsInline({
  attempts,
  user,
  onMarkOpened,
}: {
  attempts: LinkAttempt[];
  user: CommunityUser;
  onMarkOpened: (userId: string, attemptId: string) => void;
}) {
  const [selected, setSelected] = useState<LinkAttempt | null>(null);

  if (attempts.length === 0) {
    return <p className="text-xs text-slate-400 py-1">No link attempts for this user yet.</p>;
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-slate-600 mb-2">
        Link attempts ({attempts.length})
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-slate-500">
              <th className="text-left pr-4 pb-1 font-medium">Time</th>
              <th className="text-left pr-4 pb-1 font-medium">Status</th>
              <th className="text-left pr-4 pb-1 font-medium">HTTP</th>
              <th className="text-left pr-4 pb-1 font-medium">Expires</th>
              <th className="text-left pb-1 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {attempts.map((a) => (
              <tr key={a.id} className="border-t border-slate-200">
                <td className="pr-4 py-1.5 text-slate-500">{formatDate(a.created_at)}</td>
                <td className="pr-4 py-1.5">
                  <AttemptStatusBadge status={a.local_attempt_status} />
                </td>
                <td className="pr-4 py-1.5">
                  <HttpStatusBadge code={a.response_status_code} />
                </td>
                <td className="pr-4 py-1.5 text-slate-400">
                  {a.expires_at ? (
                    <span className={isExpired(a.expires_at) ? "text-red-500" : "text-green-600"}>
                      {isExpired(a.expires_at) ? "Expired" : formatDate(a.expires_at)}
                    </span>
                  ) : "—"}
                </td>
                <td className="py-1.5">
                  <div className="flex items-center gap-2">
                    {a.link_url && !isExpired(a.expires_at) && (
                      <a
                        href={a.link_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => onMarkOpened(user.id, a.id)}
                        className="flex items-center gap-1 text-blue-600 hover:underline"
                      >
                        <ExternalLink className="w-3 h-3" />
                        Open
                      </a>
                    )}
                    <button
                      onClick={() => setSelected(a)}
                      className="text-slate-500 hover:text-slate-800 underline"
                    >
                      Details
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {selected && (
        <Modal title="Attempt Details" onClose={() => setSelected(null)} wide>
          <AttemptDetailView attempt={selected} />
        </Modal>
      )}
    </div>
  );
}

// ─── Link result modal ────────────────────────────────────────────────────────

function LinkResultModal({
  attempt,
  result,
  userId,
  onMarkOpened,
  onClose,
}: {
  attempt: LinkAttempt;
  result: InitiateResult;
  userId: string;
  onMarkOpened: (userId: string, attemptId: string) => void;
  onClose: () => void;
}) {
  const wowError =
    result.parsedBody?.error && WOW_ERROR_MESSAGES[result.parsedBody.error]
      ? WOW_ERROR_MESSAGES[result.parsedBody.error]
      : null;

  return (
    <Modal title="Link Initiation Result" onClose={onClose} wide>
      <div className="space-y-5">
        {/* Status banner */}
        <div
          className={`rounded-lg px-4 py-3 flex items-center gap-3 ${
            result.success
              ? "bg-green-50 border border-green-200"
              : "bg-red-50 border border-red-200"
          }`}
        >
          <div>
            <p className={`font-medium text-sm ${result.success ? "text-green-800" : "text-red-800"}`}>
              {result.success ? "Initiation succeeded" : "Initiation failed"}
            </p>
            {result.statusCode && (
              <p className="text-xs text-slate-500 mt-0.5">
                HTTP {result.statusCode} · {result.parsedBody?.error ?? result.parsedBody?.status ?? "no status"}
              </p>
            )}
            {result.error && (
              <p className="text-xs text-red-600 mt-0.5">{result.error}</p>
            )}
            {wowError && (
              <p className="text-xs text-red-700 mt-1 font-medium">{wowError}</p>
            )}
          </div>
        </div>

        {/* Link URL */}
        {attempt.link_url && (
          <div className="rounded-lg bg-blue-50 border border-blue-200 px-4 py-3 space-y-2">
            <p className="text-sm font-medium text-blue-800">WoW Link URL</p>
            <p className="font-mono text-xs text-blue-700 break-all">{attempt.link_url}</p>
            {attempt.expires_at && (
              <p className={`text-xs ${isExpired(attempt.expires_at) ? "text-red-600" : "text-slate-500"}`}>
                Expires: {formatDate(attempt.expires_at)}
                {isExpired(attempt.expires_at) ? " — EXPIRED" : ""}
              </p>
            )}
            <div className="flex gap-2 mt-2">
              {!isExpired(attempt.expires_at) && (
                <a
                  href={attempt.link_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => onMarkOpened(userId, attempt.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700 transition-colors"
                >
                  <ExternalLink className="w-3 h-3" />
                  Open WoW Link
                </a>
              )}
              <button
                onClick={() => navigator.clipboard.writeText(attempt.link_url!)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-slate-600 border border-slate-200 text-xs rounded-md hover:bg-slate-50 transition-colors"
              >
                <ClipboardCopy className="w-3 h-3" />
                Copy Link
              </button>
            </div>
          </div>
        )}

        {/* Signing diagnostics */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-slate-700">Signing Diagnostics</h3>
          <CodeBlock label="Canonical Body" value={attempt.canonical_body} />
          <CodeBlock label="Signature (HMAC-SHA256)" value={attempt.signature} maxHeight="60px" />
        </div>

        {/* Request */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-slate-700">Request</h3>
          <CodeBlock label="Headers" value={attempt.request_headers_json} />
          <CodeBlock label="Body" value={attempt.request_body_json} />
        </div>

        {/* Response */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-slate-700">Response</h3>
          <CodeBlock
            label={`HTTP ${attempt.response_status_code ?? "—"}`}
            value={attempt.response_body_json ?? "null"}
          />
        </div>
      </div>
    </Modal>
  );
}


// ─── Form field helper ────────────────────────────────────────────────────────

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
      {hint && <p className="text-xs text-slate-400 mb-1">{hint}</p>}
      {children}
    </div>
  );
}
