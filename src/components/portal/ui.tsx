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
    <section className="portal-enter relative mb-6 overflow-hidden rounded-2xl bg-gradient-to-br from-primary-dark via-primary to-primary-light px-6 py-6 text-white shadow-lg">
      <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-24 right-24 h-48 w-48 rounded-full bg-white/10 blur-2xl" />

      <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-4">
          <span className="mt-0.5 shrink-0 rounded-xl bg-white/15 p-3 ring-1 ring-white/25">
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
    <div className="flex items-center gap-2.5 rounded-xl bg-white/10 px-3.5 py-2 ring-1 ring-white/20 backdrop-blur-sm">
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
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
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
    <section className={cn("rounded-xl border border-gray-200 bg-white shadow-sm", className)}>
      {(title || actions) && (
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-5 py-4">
          <div>
            {title && <h2 className="font-heading text-base font-bold text-dark">{title}</h2>}
            {description && <p className="mt-0.5 text-xs text-gray-500">{description}</p>}
          </div>
          {actions}
        </header>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}

export function StatusPill({ status }: { status: string }) {
  const tone =
    status === "active"
      ? "bg-green-50 text-green-700 border-green-200"
      : status === "invited"
        ? "bg-amber-50 text-amber-700 border-amber-200"
        : "bg-gray-100 text-gray-600 border-gray-200";
  return (
    <span className={cn("rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize", tone)}>
      {status}
    </span>
  );
}

export function EmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <div className="rounded-lg border border-dashed border-gray-200 px-6 py-10 text-center">
      <p className="font-medium text-gray-700">{title}</p>
      {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
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
              "flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-sm",
              allowed ? "border-green-200 bg-green-50/60" : "border-gray-200 bg-gray-50"
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
