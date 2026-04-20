"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Users, History, CheckCircle2, AlertCircle, Clock, LinkIcon } from "lucide-react";
import type { CommunityUser, LinkAttempt } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { AttemptStatusBadge, LinkStatusBadge } from "@/components/ui/Badge";

export default function DashboardPage() {
  const [users, setUsers] = useState<CommunityUser[]>([]);
  const [attempts, setAttempts] = useState<LinkAttempt[]>([]);

  useEffect(() => {
    Promise.all([
      fetch("/api/users").then((r) => r.json()),
      fetch("/api/attempts").then((r) => r.json()),
    ]).then(([u, a]) => {
      setUsers(u);
      setAttempts(a);
    });
  }, []);

  const linked = users.filter((u) =>
    ["assumed_linked", "opened_link"].includes(u.local_link_status)
  ).length;
  const errors = users.filter((u) => u.local_link_status === "error").length;
  const initiated = users.filter((u) => u.local_link_status === "initiated").length;
  const recentAttempts = attempts.slice(0, 5);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">
          Well of Wishes community linking simulator
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard
          icon={<Users className="w-5 h-5 text-slate-500" />}
          label="Total Users"
          value={users.length}
          href="/users"
        />
        <StatCard
          icon={<CheckCircle2 className="w-5 h-5 text-green-500" />}
          label="Linked / Opened"
          value={linked}
          href="/users"
        />
        <StatCard
          icon={<Clock className="w-5 h-5 text-yellow-500" />}
          label="Initiated"
          value={initiated}
          href="/users"
        />
        <StatCard
          icon={<AlertCircle className="w-5 h-5 text-red-500" />}
          label="Errors"
          value={errors}
          href="/users"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Users status breakdown */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-medium text-slate-800">Users</h2>
            <Link href="/users" className="text-xs text-blue-600 hover:underline">
              View all
            </Link>
          </div>
          {users.length === 0 ? (
            <p className="text-sm text-slate-400">Loading…</p>
          ) : (
            <div className="space-y-2">
              {users.slice(0, 6).map((u) => (
                <div
                  key={u.id}
                  className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-0"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-700">
                      {u.display_name || u.community_user_id}
                    </p>
                    <p className="text-xs text-slate-400">{u.email}</p>
                  </div>
                  <LinkStatusBadge status={u.local_link_status} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent attempts */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-medium text-slate-800">Recent Attempts</h2>
            <Link href="/attempts" className="text-xs text-blue-600 hover:underline">
              View all
            </Link>
          </div>
          {recentAttempts.length === 0 ? (
            <p className="text-sm text-slate-400">No attempts yet.</p>
          ) : (
            <div className="space-y-2">
              {recentAttempts.map((a) => (
                <div
                  key={a.id}
                  className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-0"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-700">
                      {a.display_name_snapshot || a.community_user_id}
                    </p>
                    <p className="text-xs text-slate-400">
                      {formatDate(a.created_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-slate-400">
                      {a.response_status_code ?? "—"}
                    </span>
                    <AttemptStatusBadge status={a.local_attempt_status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h2 className="font-medium text-slate-800 mb-3">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/users"
            className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
          >
            <LinkIcon className="w-4 h-4" />
            Start Linking
          </Link>
          <Link
            href="/attempts"
            className="flex items-center gap-2 px-3 py-2 bg-slate-100 text-slate-700 text-sm rounded-lg hover:bg-slate-200 transition-colors"
          >
            <History className="w-4 h-4" />
            View Attempts
          </Link>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-sm transition-shadow"
    >
      <div className="flex items-center gap-2 mb-2">{icon}</div>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      <p className="text-xs text-slate-500 mt-0.5">{label}</p>
    </Link>
  );
}
