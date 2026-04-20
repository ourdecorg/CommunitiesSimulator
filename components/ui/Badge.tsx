import type { LocalLinkStatus, LocalAttemptStatus } from "@/lib/types";

const linkStatusColors: Record<LocalLinkStatus, string> = {
  not_linked: "bg-slate-100 text-slate-600",
  initiated: "bg-yellow-100 text-yellow-700",
  opened_link: "bg-blue-100 text-blue-700",
  assumed_linked: "bg-green-100 text-green-700",
  error: "bg-red-100 text-red-700",
};

const attemptStatusColors: Record<LocalAttemptStatus, string> = {
  success: "bg-green-100 text-green-700",
  failed: "bg-red-100 text-red-700",
  expired: "bg-orange-100 text-orange-700",
  already_linked: "bg-purple-100 text-purple-700",
  unknown: "bg-slate-100 text-slate-600",
};

export function LinkStatusBadge({ status }: { status: LocalLinkStatus }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${linkStatusColors[status]}`}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}

export function AttemptStatusBadge({ status }: { status: LocalAttemptStatus }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${attemptStatusColors[status]}`}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}

export function HttpStatusBadge({ code }: { code: number | null }) {
  if (code === null)
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-500">
        —
      </span>
    );
  const color =
    code >= 200 && code < 300
      ? "bg-green-100 text-green-700"
      : code >= 400
      ? "bg-red-100 text-red-700"
      : "bg-orange-100 text-orange-700";
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium font-mono ${color}`}
    >
      {code}
    </span>
  );
}
