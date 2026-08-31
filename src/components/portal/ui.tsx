import { cn } from "@/lib/utils";

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
