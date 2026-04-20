"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

interface Props {
  label?: string;
  value: string;
  language?: string;
  maxHeight?: string;
}

export default function CodeBlock({ label, value, maxHeight = "240px" }: Props) {
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  let pretty = value;
  try {
    pretty = JSON.stringify(JSON.parse(value), null, 2);
  } catch {
    // not JSON, display as-is
  }

  return (
    <div className="rounded border border-slate-200 overflow-hidden">
      {label && (
        <div className="flex items-center justify-between px-3 py-1.5 bg-slate-100 border-b border-slate-200">
          <span className="text-xs font-medium text-slate-600">{label}</span>
          <button
            onClick={copy}
            className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 transition-colors"
          >
            {copied ? (
              <Check className="w-3 h-3 text-green-500" />
            ) : (
              <Copy className="w-3 h-3" />
            )}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      )}
      <pre
        className="text-xs font-mono p-3 bg-slate-50 overflow-auto text-slate-800 whitespace-pre-wrap break-all"
        style={{ maxHeight }}
      >
        {pretty}
      </pre>
    </div>
  );
}
