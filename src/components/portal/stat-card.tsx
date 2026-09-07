"use client";

import Link from "next/link";
import * as Icons from "lucide-react";
import { cn } from "@/lib/utils";

// Note: the "violet" tone key is kept for backwards compatibility with existing
// callers but is coloured blue (sky) so no purple gradients render in the portal.
const TONES = {
  primary: "from-blue-500/10 to-blue-500/0 text-blue-600 ring-blue-500/20",
  emerald: "from-emerald-500/10 to-emerald-500/0 text-emerald-600 ring-emerald-500/20",
  amber: "from-amber-500/10 to-amber-500/0 text-amber-600 ring-amber-500/20",
  violet: "from-sky-500/10 to-sky-500/0 text-sky-600 ring-sky-500/20",
  sky: "from-sky-500/10 to-sky-500/0 text-sky-600 ring-sky-500/20",
  rose: "from-rose-500/10 to-rose-500/0 text-rose-600 ring-rose-500/20",
  slate: "from-slate-500/10 to-slate-500/0 text-slate-600 ring-slate-500/20",
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

  const body = (
    <div
      className={cn(
        "group portal-card-hover relative h-full overflow-hidden rounded-xl border border-gray-200 bg-white p-5 shadow-soft",
        // Linked cards advertise themselves; static ones stay put.
        href && "cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      )}
    >
      <div
        className={cn(
          "absolute inset-x-0 top-0 h-24 bg-gradient-to-b",
          TONES[tone].split(" ")[0],
          TONES[tone].split(" ")[1]
        )}
      />
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</p>
          <p className="mt-2 truncate font-heading text-2xl font-bold tabular-nums text-dark transition-colors duration-200 group-hover:text-primary">
            {value}
          </p>
          {hint && <p className="mt-1 truncate text-xs text-gray-500">{hint}</p>}
        </div>
        <span
          className={cn(
            "rounded-lg bg-white p-2 ring-1 transition-transform duration-300 ease-soft group-hover:scale-110 group-hover:-rotate-3",
            TONES[tone].split(" ")[2],
            TONES[tone].split(" ")[3]
          )}
        >
          <Resolved className="h-5 w-5" />
        </span>
      </div>
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
