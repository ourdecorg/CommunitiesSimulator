"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  History,
  Bug,
  Droplets,
} from "lucide-react";

const nav = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/users", label: "Users", icon: Users },
  { href: "/attempts", label: "Attempts", icon: History },
  { href: "/debug", label: "Debug", icon: Bug },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 shrink-0 bg-slate-900 text-slate-100 flex flex-col">
      <div className="px-4 py-5 border-b border-slate-700 flex items-center gap-2">
        <Droplets className="w-5 h-5 text-blue-400" />
        <span className="font-semibold text-sm leading-tight">
          Communities<br />
          <span className="text-blue-400 font-normal">Simulator</span>
        </span>
      </div>

      <nav className="flex-1 px-2 py-4 space-y-1">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                active
                  ? "bg-slate-700 text-white"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="px-4 py-3 border-t border-slate-700 text-xs text-slate-500">
        WoW Integration v0.1
      </div>
    </aside>
  );
}
