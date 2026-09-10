import Link from "next/link";
import { Card } from "@/components/portal/ui";

export type DonutSegment = { key: string; label: string; value: number };

/**
 * Hues echo the StatusPill dots so the legend and the colour meaning travel
 * together across the portal (available → green, pending → amber, …). Hex
 * values rather than token vars are needed inside SVG stroke attributes.
 */
const SEGMENT_COLORS: Record<string, string> = {
  available: "#22C55E",
  pending: "#F59E0B",
  rented: "#0EA5E9",
  sold: "#6B7280",
};
const FALLBACK_COLOR = "#CBD5E1";

/** Radius chosen so the circumference is exactly 100 — percentages become dash lengths. */
const RADIUS = 15.9155;
const STROKE = 6;

/**
 * "Expense summary"-style donut from the reference dashboard, pointed at the
 * thing this portal actually tracks: how the property portfolio splits across
 * available, pending, rented and sold. Pure server-rendered SVG — the centre
 * total and legend live in HTML so they inherit the portal's typography and
 * dark-mode colours for free.
 */
export function ListingsStatusDonut({
  segments,
  href = "/portal/properties",
  className,
}: {
  segments: DonutSegment[];
  href?: string;
  className?: string;
}) {
  const total = segments.reduce((sum, segment) => sum + segment.value, 0);
  const multi = segments.filter((segment) => segment.value > 0).length > 1;

  const filled = segments.filter((segment) => segment.value > 0);
  // Cumulative starts, computed up front so the slice mapping itself stays
  // free of reassignment (react-hooks/immutability).
  const starts = filled.map((_, index) => filled.slice(0, index).reduce((sum, segment) => sum + segment.value, 0));
  const slices = filled.map((segment, index) => {
    const pct = (segment.value / total) * 100;
    return {
      ...segment,
      pct,
      // Shrink each slice a touch so neighbouring colours read as separate
      // segments; skip the gap when a single status owns the whole ring.
      dash: multi ? Math.max(pct - 0.8, 0.4) : 100,
      offset: 100 - (starts[index] / total) * 100 + 25,
      color: SEGMENT_COLORS[segment.key] ?? FALLBACK_COLOR,
    };
  });

  return (
    <Card
      className={className}
      title="Listings by status"
      description="Current portfolio split"
      actions={
        <Link
          href={href}
          className="text-sm font-medium text-primary underline-offset-4 transition-colors hover:text-primary-dark hover:underline"
        >
          View all
        </Link>
      }
    >
      {total === 0 ? (
        <p className="py-8 text-center text-sm text-gray-500">No listings yet — add your first property.</p>
      ) : (
        <div className="flex flex-wrap items-center gap-x-8 gap-y-6">
          <div className="relative mx-auto h-40 w-40 shrink-0 sm:mx-0">
            <svg viewBox="0 0 42 42" className="h-full w-full" role="img" aria-label={`Portfolio split: ${slices.map((slice) => `${slice.label} ${Math.round(slice.pct)}%`).join(", ")}`}>
              {slices.map((slice) => (
                <circle
                  key={slice.key}
                  cx="21"
                  cy="21"
                  r={RADIUS}
                  fill="none"
                  stroke={slice.color}
                  strokeWidth={STROKE}
                  strokeDasharray={`${slice.dash} ${100 - slice.dash}`}
                  strokeDashoffset={slice.offset}
                />
              ))}
            </svg>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <p className="font-heading text-2xl font-bold tabular-nums text-dark">{total}</p>
              <p className="text-xs text-gray-500">{total === 1 ? "listing" : "listings"}</p>
            </div>
          </div>

          <ul className="min-w-44 flex-1 space-y-2.5">
            {slices.map((slice) => (
              <li key={slice.key} className="flex items-center gap-2.5 text-sm">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: slice.color }}
                  aria-hidden="true"
                />
                <span className="min-w-0 flex-1 truncate font-medium text-gray-700">{slice.label}</span>
                <span className="shrink-0 font-semibold tabular-nums text-dark">{Math.round(slice.pct)}%</span>
                <span className="w-8 shrink-0 text-right tabular-nums text-gray-500">{slice.value}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}
