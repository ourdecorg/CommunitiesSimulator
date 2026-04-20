"use client";

import { useEffect, useState, useCallback } from "react";
import { Download, Filter, X } from "lucide-react";
import type { LinkAttempt, LocalAttemptStatus } from "@/lib/types";
import { AttemptStatusBadge, HttpStatusBadge } from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import AttemptDetailView from "@/components/attempts/AttemptDetailView";
import { formatDate, isExpired } from "@/lib/utils";

const STATUS_OPTIONS: LocalAttemptStatus[] = [
  "success",
  "failed",
  "expired",
  "already_linked",
  "unknown",
];

export default function AttemptsPage() {
  const [attempts, setAttempts] = useState<LinkAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<LinkAttempt | null>(null);

  const [filterUser, setFilterUser] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const loadAttempts = useCallback(() => {
    const params = new URLSearchParams();
    if (filterUser) params.set("userId", filterUser);
    if (filterStatus) params.set("status", filterStatus);
    if (filterFrom) params.set("from", filterFrom);
    if (filterTo) params.set("to", filterTo);
    fetch(`/api/attempts?${params}`)
      .then((r) => r.json())
      .then((d) => { setAttempts(d); setLoading(false); });
  }, [filterUser, filterStatus, filterFrom, filterTo]);

  useEffect(() => { loadAttempts(); }, [loadAttempts]);

  function clearFilters() {
    setFilterUser("");
    setFilterStatus("");
    setFilterFrom("");
    setFilterTo("");
  }

  const hasFilters = filterUser || filterStatus || filterFrom || filterTo;

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Handshake Attempts</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {attempts.length} attempt{attempts.length !== 1 ? "s" : ""}
            {hasFilters ? " (filtered)" : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters((p) => !p)}
            className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg border transition-colors ${
              showFilters || hasFilters
                ? "bg-blue-50 border-blue-200 text-blue-700"
                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            <Filter className="w-4 h-4" />
            Filter
            {hasFilters && (
              <span className="bg-blue-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                !
              </span>
            )}
          </button>
          <a
            href="/api/attempts/export"
            className="flex items-center gap-2 px-3 py-2 text-sm bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </a>
        </div>
      </div>

      {showFilters && (
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Community User ID
              </label>
              <input
                className="input text-sm"
                placeholder="usr_001"
                value={filterUser}
                onChange={(e) => setFilterUser(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Status</label>
              <select
                className="input text-sm"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="">All</option>
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">From</label>
              <input
                className="input text-sm"
                type="datetime-local"
                value={filterFrom}
                onChange={(e) => setFilterFrom(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">To</label>
              <input
                className="input text-sm"
                type="datetime-local"
                value={filterTo}
                onChange={(e) => setFilterTo(e.target.value)}
              />
            </div>
            {hasFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800"
              >
                <X className="w-4 h-4" />
                Clear
              </button>
            )}
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-slate-400">Loading…</p>
      ) : attempts.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
          <p className="text-slate-400 text-sm">
            {hasFilters
              ? "No attempts match these filters."
              : 'No attempts yet. Go to Users and click "Link to WoW".'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="text-left px-4 py-3 font-medium text-slate-600">User</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Time</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">HTTP</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Status</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Link</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Nonce</th>
                <th className="text-right px-4 py-3 font-medium text-slate-600"></th>
              </tr>
            </thead>
            <tbody>
              {attempts.map((a) => (
                <tr
                  key={a.id}
                  className="border-b border-slate-100 last:border-0 hover:bg-slate-50 cursor-pointer"
                  onClick={() => setSelected(a)}
                >
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-800">
                      {a.display_name_snapshot || "—"}
                    </p>
                    <p className="text-xs text-slate-400 font-mono">
                      {a.community_user_id}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                    {formatDate(a.created_at)}
                  </td>
                  <td className="px-4 py-3">
                    <HttpStatusBadge code={a.response_status_code} />
                  </td>
                  <td className="px-4 py-3">
                    <AttemptStatusBadge status={a.local_attempt_status} />
                  </td>
                  <td className="px-4 py-3">
                    {a.link_url ? (
                      <span
                        className={`text-xs ${
                          isExpired(a.expires_at)
                            ? "text-red-500"
                            : "text-green-600"
                        }`}
                      >
                        {isExpired(a.expires_at) ? "Expired" : "Available"}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-300">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-400 max-w-xs truncate">
                    {a.nonce.slice(0, 12)}…
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={(e) => { e.stopPropagation(); setSelected(a); }}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <Modal
          title={`Attempt — ${selected.display_name_snapshot || selected.community_user_id}`}
          onClose={() => setSelected(null)}
          wide
        >
          <AttemptDetailView attempt={selected} />
        </Modal>
      )}
    </div>
  );
}
