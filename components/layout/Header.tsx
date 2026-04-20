"use client";

import { useEffect, useState } from "react";

export default function Header() {
  const [wowUrl, setWowUrl] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/debug/env")
      .then((r) => r.json())
      .then((d) => setWowUrl(d.env?.WOW_BASE_URL?.value ?? null))
      .catch(() => null);
  }, []);

  return (
    <header className="h-12 shrink-0 bg-white border-b border-slate-200 flex items-center px-6 gap-4">
      <div className="flex-1" />
      {wowUrl && (
        <span className="text-xs bg-blue-50 text-blue-700 border border-blue-200 rounded px-2 py-1 font-mono">
          WoW: {wowUrl}
        </span>
      )}
    </header>
  );
}
