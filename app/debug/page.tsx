"use client";

import { useEffect, useState, useCallback } from "react";
import {
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Zap,
} from "lucide-react";
import type { CommunityUser, LinkAttempt, InitiateResult } from "@/lib/types";
import CodeBlock from "@/components/ui/CodeBlock";
import { AttemptStatusBadge, HttpStatusBadge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils";
import { WOW_ERROR_MESSAGES } from "@/lib/types";

interface EnvData {
  env: {
    WOW_BASE_URL: { set: boolean; value: string | null };
    COMMUNITY_LINK_CLIENT_KEY: { set: boolean; value: string | null };
    COMMUNITY_LINK_SHARED_SECRET: { set: boolean; hint: string | null };
    DEFAULT_SERVER_ID: { set: boolean; value: string | null };
  };
  preview: {
    timestamp: string;
    nonce: string;
    sampleBody: Record<string, unknown>;
    signingPreview: {
      canonicalBody: string;
      message: string;
      signature: string;
    } | null;
  };
}

type DebugScenario = "invalid_signature" | "reused_nonce" | "expired_timestamp";

export default function DebugPage() {
  const [envData, setEnvData] = useState<EnvData | null>(null);
  const [users, setUsers] = useState<CommunityUser[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [running, setRunning] = useState<DebugScenario | "reset" | null>(null);
  const [lastResult, setLastResult] = useState<{
    scenario: DebugScenario;
    attempt: LinkAttempt;
    result: InitiateResult;
    extra?: Record<string, string>;
  } | null>(null);
  const [resetDone, setResetDone] = useState(false);

  const loadEnv = useCallback(() => {
    fetch("/api/debug/env")
      .then((r) => r.json())
      .then(setEnvData);
  }, []);

  useEffect(() => {
    loadEnv();
    fetch("/api/users")
      .then((r) => r.json())
      .then((d: CommunityUser[]) => {
        setUsers(d);
        if (d.length > 0) setSelectedUserId(d[0].id);
      });
  }, [loadEnv]);

  async function runDebug(scenario: DebugScenario) {
    if (!selectedUserId) return;
    setRunning(scenario);
    const urlMap: Record<DebugScenario, string> = {
      invalid_signature: "/api/debug/initiate-invalid-signature",
      reused_nonce: "/api/debug/initiate-reused-nonce",
      expired_timestamp: "/api/debug/initiate-expired-request",
    };
    const res = await fetch(urlMap[scenario], {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: selectedUserId }),
    });
    const data = await res.json();
    setRunning(null);
    setLastResult({
      scenario,
      attempt: data.attempt,
      result: data.result,
      extra: data.reusedNonce
        ? { reusedNonce: data.reusedNonce }
        : data.expiredTimestamp
        ? { expiredTimestamp: data.expiredTimestamp }
        : undefined,
    });
  }

  async function resetData() {
    setRunning("reset");
    await fetch("/api/seed/reset", { method: "POST" });
    setRunning(null);
    setResetDone(true);
    setTimeout(() => setResetDone(false), 3000);
    const users = await fetch("/api/users").then((r) => r.json());
    setUsers(users);
    if (users.length > 0) setSelectedUserId(users[0].id);
  }

  const allEnvSet = envData
    ? Object.values(envData.env).every((v) => v.set)
    : false;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Debug Panel</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Environment health · signing utilities · error scenario testing
        </p>
      </div>

      <div className="rounded-lg bg-yellow-50 border border-yellow-200 px-4 py-3 flex items-start gap-2">
        <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 shrink-0" />
        <p className="text-sm text-yellow-800">
          Debug tests below intentionally send <strong>invalid requests</strong> to
          WoW to test error handling. Use only in development.
        </p>
      </div>

      {/* Env health */}
      <Section title="Environment Variables">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {allEnvSet ? (
              <CheckCircle2 className="w-4 h-4 text-green-500" />
            ) : (
              <XCircle className="w-4 h-4 text-red-500" />
            )}
            <span className="text-sm text-slate-600">
              {allEnvSet ? "All variables set" : "Some variables missing"}
            </span>
          </div>
          <button
            onClick={loadEnv}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800"
          >
            <RefreshCw className="w-3 h-3" />
            Refresh
          </button>
        </div>

        {envData && (
          <div className="space-y-2">
            {Object.entries(envData.env).map(([key, val]) => (
              <div
                key={key}
                className="flex items-center justify-between text-sm py-1.5 border-b border-slate-100 last:border-0"
              >
                <span className="font-mono text-xs text-slate-700">{key}</span>
                <div className="flex items-center gap-2">
                  {val.set ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                  ) : (
                    <XCircle className="w-3.5 h-3.5 text-red-400" />
                  )}
                  <span className="text-xs text-slate-400 font-mono max-w-xs truncate">
                    {"hint" in val
                      ? (val as { hint: string | null }).hint ?? "not set"
                      : (val as { value: string | null }).value ?? "not set"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* Signing preview */}
      {envData?.preview && (
        <Section title="Signing Preview (sample body)">
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <p className="text-slate-500 mb-1">Generated Timestamp</p>
                <p className="font-mono bg-slate-50 rounded px-2 py-1 border border-slate-200">
                  {envData.preview.timestamp}
                </p>
              </div>
              <div>
                <p className="text-slate-500 mb-1">Generated Nonce</p>
                <p className="font-mono bg-slate-50 rounded px-2 py-1 border border-slate-200 break-all">
                  {envData.preview.nonce}
                </p>
              </div>
            </div>
            <CodeBlock
              label="Sample Request Body"
              value={JSON.stringify(envData.preview.sampleBody)}
            />
            {envData.preview.signingPreview ? (
              <>
                <CodeBlock
                  label="Canonical Body (keys sorted alphabetically)"
                  value={envData.preview.signingPreview.canonicalBody}
                />
                <CodeBlock
                  label='Signing Message (timestamp + "\\n" + nonce + "\\n" + canonicalBody)'
                  value={envData.preview.signingPreview.message}
                />
                <CodeBlock
                  label="HMAC-SHA256 Signature"
                  value={envData.preview.signingPreview.signature}
                  maxHeight="60px"
                />
              </>
            ) : (
              <p className="text-xs text-slate-400">
                Set COMMUNITY_LINK_SHARED_SECRET to see signing preview.
              </p>
            )}
          </div>
        </Section>
      )}

      {/* Debug scenarios */}
      <Section title="Error Scenario Tests">
        <div className="mb-4">
          <label className="block text-xs font-medium text-slate-600 mb-1">
            Test with user
          </label>
          <select
            className="input text-sm"
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
          >
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.display_name || u.community_user_id} ({u.email})
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-3">
          <DebugAction
            title="Invalid Signature"
            description="Sends a zeroed-out signature. WoW should return INVALID_SIGNATURE."
            color="red"
            running={running === "invalid_signature"}
            onClick={() => runDebug("invalid_signature")}
          />
          <DebugAction
            title="Reused Nonce (Replay Attack)"
            description="Reuses the most recent nonce for this user. WoW should return NONCE_ALREADY_USED."
            color="orange"
            running={running === "reused_nonce"}
            onClick={() => runDebug("reused_nonce")}
          />
          <DebugAction
            title="Expired Timestamp"
            description="Sends a timestamp 1 hour in the past. WoW should return EXPIRED_REQUEST."
            color="orange"
            running={running === "expired_timestamp"}
            onClick={() => runDebug("expired_timestamp")}
          />
        </div>

        {lastResult && (
          <div className="mt-5 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-slate-700">
                Last debug result:{" "}
                <span className="font-mono">{lastResult.scenario}</span>
              </h4>
              <div className="flex items-center gap-2">
                <HttpStatusBadge code={lastResult.attempt.response_status_code} />
                <AttemptStatusBadge status={lastResult.attempt.local_attempt_status} />
              </div>
            </div>

            {lastResult.result.parsedBody?.error &&
              WOW_ERROR_MESSAGES[lastResult.result.parsedBody.error] && (
                <div className="rounded bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-800">
                  <strong>{lastResult.result.parsedBody.error}:</strong>{" "}
                  {WOW_ERROR_MESSAGES[lastResult.result.parsedBody.error]}
                </div>
              )}

            {lastResult.extra && (
              <div className="rounded bg-slate-50 border border-slate-200 px-3 py-2 text-xs font-mono text-slate-600 space-y-1">
                {Object.entries(lastResult.extra).map(([k, v]) => (
                  <div key={k}>
                    <span className="text-slate-400">{k}: </span>
                    {v}
                  </div>
                ))}
              </div>
            )}

            <CodeBlock label="Request Headers" value={lastResult.attempt.request_headers_json} />
            <CodeBlock label="Request Body" value={lastResult.attempt.request_body_json} />
            <CodeBlock
              label="Response Body"
              value={lastResult.attempt.response_body_json ?? "null"}
            />
          </div>
        )}
      </Section>

      {/* Data management */}
      <Section title="Data Management">
        <div className="flex items-center gap-4">
          <button
            onClick={resetData}
            disabled={running === "reset"}
            className="flex items-center gap-2 px-3 py-2 bg-red-50 text-red-700 border border-red-200 text-sm rounded-lg hover:bg-red-100 disabled:opacity-50 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            {running === "reset" ? "Resetting…" : "Reset & Re-seed Data"}
          </button>
          {resetDone && (
            <span className="text-sm text-green-600 flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" />
              Reset complete
            </span>
          )}
          <p className="text-xs text-slate-400">
            Clears all users and attempts, then re-seeds the 10 demo users.
          </p>
        </div>
      </Section>

      {/* Error codes reference */}
      <Section title="WoW Error Code Reference">
        <div className="space-y-2">
          {Object.entries(WOW_ERROR_MESSAGES).map(([code, msg]) => (
            <div key={code} className="flex gap-3 py-1.5 border-b border-slate-100 last:border-0">
              <span className="font-mono text-xs text-red-600 whitespace-nowrap shrink-0 w-44">
                {code}
              </span>
              <span className="text-sm text-slate-600">{msg}</span>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <h2 className="font-medium text-slate-800 mb-4">{title}</h2>
      {children}
    </div>
  );
}

function DebugAction({
  title,
  description,
  color,
  running,
  onClick,
}: {
  title: string;
  description: string;
  color: "red" | "orange";
  running: boolean;
  onClick: () => void;
}) {
  const colors = {
    red: "bg-red-50 border-red-200 text-red-700 hover:bg-red-100",
    orange: "bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100",
  };
  return (
    <div className="flex items-center justify-between rounded-lg border p-3 bg-slate-50 border-slate-200">
      <div>
        <p className="text-sm font-medium text-slate-700">{title}</p>
        <p className="text-xs text-slate-400 mt-0.5">{description}</p>
      </div>
      <button
        onClick={onClick}
        disabled={running}
        className={`ml-4 shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md border font-medium disabled:opacity-50 transition-colors ${colors[color]}`}
      >
        <Zap className="w-3 h-3" />
        {running ? "Running…" : "Run Test"}
      </button>
    </div>
  );
}
