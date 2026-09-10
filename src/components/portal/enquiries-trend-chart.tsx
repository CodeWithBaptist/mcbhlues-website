import Link from "next/link";
import { TrendingDown, TrendingUp } from "lucide-react";
import { Card } from "@/components/portal/ui";
import { cn } from "@/lib/utils";

export type TrendPoint = { label: string; value: number };

const WIDTH = 640;
const HEIGHT = 252;
/** Left gutter reserved for the y-axis scale labels. */
const GUTTER = 40;
const TOP = 18;
/** Room beneath the plot for the month labels. */
const BOTTOM = 30;
const GRID_TICKS = 4;

/** Round `raw` up to a friendly 1 | 2 | 5 × 10ⁿ step for the y-axis. */
function niceStep(raw: number): number {
  const magnitude = 10 ** Math.floor(Math.log10(raw));
  for (const multiplier of [1, 2, 5, 10]) {
    if (multiplier * magnitude >= raw) return multiplier * magnitude;
  }
  return 10 * magnitude;
}

/**
 * Monthly volume chart for the dashboard — a smoothed area line in the brand
 * colour with a quiet grid, modelled on the classic "revenue over the last six
 * months" dashboard card. Rendered entirely as SVG on the server: no chart
 * dependency, no client JavaScript, and screen readers get the same numbers
 * through the aria-label.
 *
 * Ink comes from `currentColor` inside a `text-primary` group so the line and
 * dots follow the theme's dark-mode override automatically; grid and labels
 * read the portal's surface/copy tokens for the same reason.
 */
export function EnquiriesTrendChart({
  points,
  /** Percent change vs the previous six months; null when there is no baseline. */
  delta,
  href = "/portal/enquiries",
  className,
}: {
  points: TrendPoint[];
  delta: number | null;
  href?: string;
  className?: string;
}) {
  const total = points.reduce((sum, point) => sum + point.value, 0);
  const max = Math.max(0, ...points.map((point) => point.value));
  const step = niceStep(Math.max(1, max) / GRID_TICKS);
  const ceiling = Math.max(step * GRID_TICKS, Math.ceil(max / step) * step);

  const plotWidth = WIDTH - GUTTER - 10;
  const plotHeight = HEIGHT - TOP - BOTTOM;
  const x = (index: number) =>
    GUTTER + (points.length <= 1 ? plotWidth / 2 : (index / (points.length - 1)) * plotWidth);
  const y = (value: number) => TOP + plotHeight - (value / ceiling) * plotHeight;

  const coords = points.map((point, index) => [x(index), y(point.value)] as const);

  // Catmull-Rom → cubic Bézier gives the relaxed curve between monthly points.
  let line = "";
  coords.forEach((_, index) => {
    if (index === 0) {
      line = `M ${coords[0][0]} ${coords[0][1]}`;
      return;
    }
    const p0 = coords[Math.max(0, index - 1)];
    const p1 = coords[index - 1];
    const p2 = coords[index];
    const p3 = coords[Math.min(coords.length - 1, index + 1)];
    line += ` C ${p1[0] + (p2[0] - p0[0]) / 6} ${p1[1] + (p2[1] - p0[1]) / 6},`;
    line += ` ${p2[0] - (p3[0] - p1[0]) / 6} ${p2[1] - (p3[1] - p1[1]) / 6},`;
    line += ` ${p2[0]} ${p2[1]}`;
  });

  const baseline = TOP + plotHeight;
  const area = line
    ? `${line} L ${coords[coords.length - 1][0]} ${baseline} L ${coords[0][0]} ${baseline} Z`
    : "";

  const ticks = Array.from({ length: GRID_TICKS + 1 }, (_, index) => ceiling - step * (GRID_TICKS - index));

  const summary = points.map((point) => `${point.label}: ${point.value}`).join(", ");

  return (
    <Card
      className={className}
      title="Enquiries trend"
      description={`Last ${points.length} months · ${total} new ${total === 1 ? "enquiry" : "enquiries"}`}
      actions={
        <>
          {delta !== null && (
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold tabular-nums",
                delta >= 0 ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
              )}
              title="Change vs the previous six months"
            >
              {delta >= 0 ? (
                <TrendingUp className="h-3.5 w-3.5" aria-hidden="true" />
              ) : (
                <TrendingDown className="h-3.5 w-3.5" aria-hidden="true" />
              )}
              {delta >= 0 ? "+" : "−"}
              {Math.abs(delta)}%
            </span>
          )}
          <Link
            href={href}
            className="text-sm font-medium text-primary underline-offset-4 transition-colors hover:text-primary-dark hover:underline"
          >
            View all
          </Link>
        </>
      }
    >
      {line === "" ? (
        <p className="py-8 text-center text-sm text-gray-500">No enquiry activity yet.</p>
      ) : (
        <div className="-m-1">
          <svg
            viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
            role="img"
            aria-label={`New enquiries per month — ${summary}`}
            className="h-auto w-full"
            preserveAspectRatio="xMidYMid meet"
          >
            <defs>
              <linearGradient id="enquiries-trend-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.18" />
                <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0.02" />
              </linearGradient>
            </defs>

            {ticks.map((tick) => (
              <g key={tick}>
                <line
                  x1={GUTTER}
                  x2={WIDTH - 10}
                  y1={y(tick)}
                  y2={y(tick)}
                  stroke="var(--site-border)"
                  strokeDasharray={tick === 0 ? undefined : "3 5"}
                />
                <text x={GUTTER - 8} y={y(tick) + 4} textAnchor="end" fontSize="11" fill="var(--site-copy-muted)">
                  {tick}
                </text>
              </g>
            ))}

            <path d={area} fill="url(#enquiries-trend-fill)" />

            <g className="text-primary">
              <path d={line} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
              {coords.map(([cx, cy], index) => (
                <circle
                  key={points[index].label}
                  cx={cx}
                  cy={cy}
                  r="4.5"
                  fill="currentColor"
                  stroke="var(--site-surface)"
                  strokeWidth="2.5"
                />
              ))}
            </g>

            {points.map((point, index) => (
              <text
                key={point.label}
                x={coords[index][0]}
                y={HEIGHT - 8}
                textAnchor="middle"
                fontSize="11"
                fill="var(--site-copy-muted)"
              >
                {point.label}
              </text>
            ))}
          </svg>
        </div>
      )}
    </Card>
  );
}
