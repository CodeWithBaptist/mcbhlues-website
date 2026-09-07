import { cn } from "@/lib/utils";

/**
 * Gradient hero banner used to headline the redesigned administration pages.
 * Matches the dashboard hero's visual language: brand gradient, soft orbs and
 * a glass icon chip, with an optional slot for contextual meta on the right.
 */
export function PageHero({
  kicker,
  title,
  description,
  icon,
  children,
}: {
  kicker?: string;
  title: string;
  description?: string;
  icon: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <section className="portal-enter relative mb-6 overflow-hidden rounded-2xl bg-gradient-to-br from-primary-dark via-primary to-primary-light px-6 py-6 text-white shadow-lg ring-1 ring-white/10">
      <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-24 right-24 h-48 w-48 rounded-full bg-white/10 blur-2xl" />

      <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-4">
          <span className="mt-0.5 shrink-0 rounded-xl bg-white/15 p-3 ring-1 ring-white/25 transition-transform duration-300 ease-soft hover:scale-105">
            {icon}
          </span>
          <div className="min-w-0">
            {kicker && (
              <p className="text-[11px] font-semibold uppercase tracking-widest text-blue-100">
                {kicker}
              </p>
            )}
            <h1 className="mt-0.5 font-heading text-2xl font-extrabold">{title}</h1>
            {description && (
              <p className="mt-1 max-w-2xl text-sm text-blue-100">{description}</p>
            )}
          </div>
        </div>
        {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
      </div>
    </section>
  );
}

/** Frosted-glass pill used inside {@link PageHero} for contextual meta. */
export function HeroMeta({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2.5 rounded-xl bg-white/10 px-3.5 py-2 ring-1 ring-white/20 backdrop-blur-sm transition-colors duration-200 hover:bg-white/15">
      <span className="text-blue-100">{icon}</span>
      <span>
        <span className="block text-[10px] font-medium uppercase tracking-wider text-blue-200">
          {label}
        </span>
        <span className="block text-sm font-semibold leading-tight">{value}</span>
      </span>
    </div>
  );
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
    <div className="portal-enter mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="font-heading text-2xl font-bold text-dark">{title}</h1>
        {description && <p className="mt-1 text-sm text-gray-600">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
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
        "portal-enter rounded-xl border border-gray-200 bg-white shadow-soft transition-shadow duration-300",
        className
      )}
    >
      {(title || actions) && (
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-5 py-4">
          <div>
            {title && <h2 className="font-heading text-base font-bold text-dark">{title}</h2>}
            {description && <p className="mt-0.5 text-xs text-gray-500">{description}</p>}
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
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize transition-colors duration-200",
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
    <div className="animate-fade-up rounded-xl border border-dashed border-gray-300 bg-gray-50/50 px-6 py-12 text-center transition-colors duration-300 hover:border-primary/30 hover:bg-primary/[0.02]">
      {icon && (
        <div
          className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary"
          aria-hidden="true"
        >
          {icon}
        </div>
      )}
      <p className="font-medium text-gray-700">{title}</p>
      {description && <p className="mx-auto mt-1 max-w-md text-sm text-gray-500">{description}</p>}
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}

/**
 * Inline feedback banner used by the portal managers after a save, publish,
 * delete, etc. `role="status"` announces successes politely; errors get
 * `role="alert"` so they interrupt.
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
    ok: "border-green-200 bg-green-50 text-green-800",
    error: "border-red-200 bg-red-50 text-red-800",
    info: "border-blue-200 bg-blue-50 text-blue-800",
    warning: "border-amber-200 bg-amber-50 text-amber-900",
  } as const;

  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "animate-fade-up flex items-start justify-between gap-3 rounded-lg border px-3.5 py-2.5 text-sm shadow-2xs",
        tones[tone],
        className
      )}
    >
      <span className="min-w-0">{children}</span>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss message"
          className="-mr-1 shrink-0 rounded-md p-1 opacity-60 transition-opacity hover:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"
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
              "flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-sm transition-colors duration-200",
              allowed
                ? "border-green-200 bg-green-50/60 hover:bg-green-50"
                : "border-gray-200 bg-gray-50 hover:bg-gray-100"
            )}
          >
            <span className={allowed ? "text-gray-800" : "text-gray-400 line-through"}>
              {entry.label}
            </span>
            <code
              className={cn(
                "rounded px-1.5 py-0.5 text-[11px]",
                allowed ? "bg-green-100 text-green-800" : "bg-gray-200 text-gray-500"
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
