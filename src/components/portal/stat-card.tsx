"use client";

import Link from "next/link";
import * as Icons from "lucide-react";
import { cn } from "@/lib/utils";

// Note: the \"violet\" tone key is kept for backwards compatibility with existing
// callers but is coloured blue (sky) so no purple gradients render in the portal.
const TONES = {
  primary: {
    bg: "from-blue-500/[0.08] via-blue-500/[0.04] to-transparent",
    icon: "bg-blue-50 text-blue-600 ring-blue-500/15",
    accent: "bg-blue-500",
  },
  emerald: {
    bg: "from-emerald-500/[0.08] via-emerald-500/[0.04] to-transparent",
    icon: "bg-emerald-50 text-emerald-600 ring-emerald-500/15",
    accent: "bg-emerald-500",
  },
  amber: {
    bg: "from-amber-500/[0.09] via-amber-500/[0.04] to-transparent",
    icon: "bg-amber-50 text-amber-600 ring-amber-500/15",
    accent: "bg-amber-500",
  },
  violet: {
    bg: "from-sky-500/[0.08] via-sky-500/[0.04] to-transparent",
    icon: "bg-sky-50 text-sky-600 ring-sky-500/15",
    accent: "bg-sky-500",
  },
  sky: {
    bg: "from-sky-500/[0.08] via-sky-500/[0.04] to-transparent",
    icon: "bg-sky-50 text-sky-600 ring-sky-500/15",
    accent: "bg-sky-500",
  },
  rose: {
    bg: "from-rose-500/[0.08] via-rose-500/[0.04] to-transparent",
    icon: "bg-rose-50 text-rose-600 ring-rose-500/15",
    accent: "bg-rose-500",
  },
  slate: {
    bg: "from-slate-500/[0.07] via-slate-500/[0.03] to-transparent",
    icon: "bg-slate-50 text-slate-600 ring-slate-500/15",
    accent: "bg-slate-500",
  },
} as const;

export function StatCard({
  label,
  value,
  hint,
  icon,
  tone = "primary",
  href,
}: {
  label: string;
  value: string;
  hint?: string;
  icon: string;
  tone?: keyof typeof TONES;
  href?: string;
}) {
  const Resolved =
    (Icons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[icon] ??
    Icons.Circle;
  const t = TONES[tone];

  const body = (
    <div
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-2xl border border-gray-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_-12px_rgba(15,23,42,0.12)] transition-all duration-300 ease-soft",
        "hover:-translate-y-0.5 hover:border-gray-200 hover:shadow-[0_8px_28px_-14px_rgba(15,23,42,0.18),0_4px_12px_rgba(15,23,42,0.06)]",
        href && "cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      )}
    >
      {/* top accent bar */}
      <span className={cn("pointer-events-none absolute inset-x-0 top-0 h-1", t.accent)} />

      {/* soft gradient wash */}
      <div className={cn("pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b", t.bg)} />

      {/* subtle grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(to right, #0f172a 1px, transparent 1px), linear-gradient(to bottom, #0f172a 1px, transparent 1px)",
          backgroundSize: "22px 22px",
        }}
      />

      <div className="relative flex flex-1 items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-gray-500">
            <span className={cn("h-1.5 w-1.5 rounded-full", t.accent)} />
            {label}
          </p>
          <p className="mt-2.5 font-heading text-[26px] font-extrabold leading-none tracking-tight tabular-nums text-dark transition-colors duration-200 group-hover:text-primary">
            {value}
          </p>
          {hint && (
            <p className="mt-1.5 inline-flex items-center gap-1 truncate text-xs font-medium text-gray-500">
              {hint}
            </p>
          )}
        </div>

        <span
          className={cn(
            "relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ring-1 backdrop-blur-sm transition-all duration-300 ease-soft group-hover:scale-[1.06] group-hover:rotate-[-3deg] group-hover:shadow-sm",
            t.icon
          )}
        >
          <Resolved className="h-5 w-5" />
          <span className="pointer-events-none absolute inset-0 rounded-xl bg-gradient-to-br from-white/30 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
        </span>
      </div>

      {/* footer affordance */}
      {href && (
        <div className="relative mt-4 flex items-center gap-1 text-xs font-semibold text-gray-400 transition-colors group-hover:text-primary">
          View details
          <Icons.ArrowRight className="h-3.5 w-3.5 -translate-x-0.5 opacity-0 transition-all duration-300 ease-soft group-hover:translate-x-0 group-hover:opacity-100" />
        </div>
      )}
    </div>
  );

  return href ? (
    <Link href={href} className="block h-full">
      {body}
    </Link>
  ) : (
    body
  );
}
