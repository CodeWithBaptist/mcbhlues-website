"use client";

import { useEffect, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, Info, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

/** Shared editorial page heading. Icons remain accepted for existing callers. */
export function PageHero({ kicker, title, description, children }: {
  kicker?: string; title: string; description?: string; icon: React.ReactNode; children?: React.ReactNode;
}) {
  return <section className="mb-6 flex flex-col justify-between gap-5 border-b border-gray-200 pb-6 lg:flex-row lg:items-end">
    <div className="min-w-0">
      {kicker && <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-primary">{kicker}</p>}
      <h1 className="font-heading text-2xl font-bold tracking-tight text-dark sm:text-[28px]">{title}</h1>
      {description && <p className="mt-2 max-w-2xl text-sm leading-relaxed text-gray-600">{description}</p>}
    </div>
    {children && <div className="flex shrink-0 flex-wrap gap-x-6 gap-y-3">{children}</div>}
  </section>;
}

export function HeroMeta({ label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return <div className="border-l border-gray-200 pl-4">
    <p className="text-xs text-gray-500">{label}</p>
    <p className="mt-1 text-sm font-semibold text-dark">{value}</p>
  </div>;
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="font-heading text-2xl font-bold tracking-tight text-dark sm:text-[26px]">{title}</h1>
        {description && <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-gray-600">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Card({
  children,
  className,
  title,
  description,
  actions,
}: {
  children?: React.ReactNode;
  className?: string;
  title?: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <section
      className={cn(
        "portal-card min-w-0 overflow-hidden rounded-lg border border-gray-200 bg-white",
        className
      )}
    >
      {(title || actions) && (
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 px-5 py-4">
          <div className="min-w-0">
            {title && <h2 className="font-heading text-base font-bold tracking-tight text-dark">{title}</h2>}
            {description && <p className="mt-0.5 text-sm text-gray-500">{description}</p>}
          </div>
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </header>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}

/**
 * Status chip. The leading dot carries the state as well as the colour, so the
 * pill stays readable for people who cannot distinguish the hues.
 */
const STATUS_TONES: Record<string, { className: string; dot: string }> = {
  active: { className: "border-green-200 bg-green-50 text-green-700", dot: "bg-green-500" },
  available: { className: "border-green-200 bg-green-50 text-green-700", dot: "bg-green-500" },
  confirmed: { className: "border-green-200 bg-green-50 text-green-700", dot: "bg-green-500" },
  completed: { className: "border-green-200 bg-green-50 text-green-700", dot: "bg-green-500" },
  responded: { className: "border-blue-200 bg-blue-50 text-blue-700", dot: "bg-blue-500" },
  in_progress: { className: "border-blue-200 bg-blue-50 text-blue-700", dot: "bg-blue-500" },
  new: { className: "border-sky-200 bg-sky-50 text-sky-700", dot: "bg-sky-500" },
  lead: { className: "border-sky-200 bg-sky-50 text-sky-700", dot: "bg-sky-500" },
  pending: { className: "border-amber-200 bg-amber-50 text-amber-700", dot: "bg-amber-500" },
  invited: { className: "border-amber-200 bg-amber-50 text-amber-700", dot: "bg-amber-500" },
  suspended: { className: "border-red-200 bg-red-50 text-red-700", dot: "bg-red-500" },
  rejected: { className: "border-red-200 bg-red-50 text-red-700", dot: "bg-red-500" },
  cancelled: { className: "border-red-200 bg-red-50 text-red-700", dot: "bg-red-500" },
  sold: { className: "border-gray-300 bg-gray-100 text-gray-700", dot: "bg-gray-500" },
  rented: { className: "border-gray-300 bg-gray-100 text-gray-700", dot: "bg-gray-500" },
  closed: { className: "border-gray-200 bg-gray-100 text-gray-600", dot: "bg-gray-400" },
  inactive: { className: "border-gray-200 bg-gray-100 text-gray-600", dot: "bg-gray-400" },
};

export function StatusPill({ status }: { status: string }) {
  const tone =
    STATUS_TONES[status] ?? { className: "border-gray-200 bg-gray-100 text-gray-600", dot: "bg-gray-400" };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs font-medium capitalize transition-colors duration-200",
        tone.className
      )}
    >
      <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", tone.dot)} aria-hidden="true" />
      {status.replaceAll("_", " ")}
    </span>
  );
}

export function EmptyState({
  title,
  description,
  icon,
  action,
}: {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="portal-empty px-4 py-8 text-center">
      {icon && (
        <div
          className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-50 text-gray-400 ring-1 ring-gray-200"
          aria-hidden="true"
        >
          {icon}
        </div>
      )}
      <p className="font-heading text-[15px] font-bold text-dark">{title}</p>
      {description && <p className="mx-auto mt-1.5 max-w-md text-sm leading-relaxed text-gray-500">{description}</p>}
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}

const NOTICE_ICONS = {
  ok: CheckCircle2,
  error: XCircle,
  info: Info,
  warning: AlertTriangle,
} as const;

/**
 * Inline feedback banner used by the portal managers after a save, publish,
 * delete, etc. `role=\"status\"` announces successes politely; errors get
 * `role=\"alert\"` so they interrupt.
 *
 * The leading icon inherits the banner's text colour so it stays correct in
 * both themes without new colour tokens. Dismissal fades out before unmounting
 * (instantly under reduced motion).
 */
export function Notice({
  tone = "ok",
  children,
  onDismiss,
  className,
}: {
  tone?: "ok" | "error" | "info" | "warning";
  children: React.ReactNode;
  onDismiss?: () => void;
  className?: string;
}) {
  const tones = {
    ok: "border-green-200 bg-green-50 text-green-800 shadow-green-500/10",
    error: "border-red-200 bg-red-50 text-red-800 shadow-red-500/10",
    info: "border-blue-200 bg-blue-50 text-blue-800 shadow-blue-500/10",
    warning: "border-amber-200 bg-amber-50 text-amber-900 shadow-amber-500/10",
  } as const;

  const [leaving, setLeaving] = useState(false);
  const timer = useRef<number | null>(null);
  useEffect(
    () => () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
    },
    []
  );

  function dismiss() {
    if (!onDismiss || leaving) return;
    if (
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      onDismiss();
      return;
    }
    setLeaving(true);
    timer.current = window.setTimeout(onDismiss, 170);
  }

  const Icon = NOTICE_ICONS[tone];

  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "animate-fade-in flex items-start justify-between gap-3 rounded-md border px-4 py-3 text-sm font-medium",
        tones[tone],
        leaving && "portal-notice-leave",
        className
      )}
    >
      <span className="flex min-w-0 items-start gap-2.5">
        <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        <span className="min-w-0 leading-relaxed">{children}</span>
      </span>
      {onDismiss && (
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss message"
          className=" -mr-1 shrink-0 rounded-lg p-1.5 opacity-60 transition-all hover:bg-black/5 hover:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"
        >
          <svg viewBox="0 0 20 20" className="h-4 w-4" aria-hidden="true" fill="currentColor">
            <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
          </svg>
        </button>
      )}
    </div>
  );
}

/**
 * Renders a read-only summary of what the signed-in user may do inside a
 * module. Used by the operational modules whose data layer is not part of the
 * RBAC deliverable, so the permission wiring is still visible and testable.
 */
export function PermissionChecklist({
  granted,
  entries,
}: {
  granted: string[];
  entries: { key: string; label: string }[];
}) {
  return (
    <ul className="grid gap-2 sm:grid-cols-2">
      {entries.map((entry) => {
        const allowed = granted.includes(entry.key);
        return (
          <li
            key={entry.key}
            className={cn(
              "flex items-center justify-between gap-3 rounded-xl border px-3.5 py-2.5 text-sm font-medium transition-all duration-200",
              allowed
                ? "border-green-200 bg-green-50/70 hover:bg-green-50 shadow-sm"
                : "border-gray-200 bg-gray-50 hover:bg-white"
            )}
          >
            <span className={allowed ? "text-gray-800" : "text-gray-400 line-through"}>
              {entry.label}
            </span>
            <code
              className={cn(
                "rounded-lg px-1.5 py-1 text-[11px] font-semibold",
                allowed ? "bg-green-100 text-green-800 ring-1 ring-green-200" : "bg-gray-200 text-gray-500"
              )}
            >
              {entry.key}
            </code>
          </li>
        );
      })}
    </ul>
  );
}
