import type { CSSProperties } from "react";
import { Container } from "@/components/ui/container";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/**
 * Route-level loading states.
 *
 * Each skeleton mirrors the shape of the page it stands in for, so the layout
 * does not jump when the real content streams in (no cumulative layout shift).
 * They are rendered from `loading.tsx` files, which Next.js shows the instant a
 * navigation starts.
 */

function StatusLabel({ text }: { text: string }) {
  return (
    <p className="sr-only" role="status">
      {text}
    </p>
  );
}

/** One placeholder listing card, matching `PropertyCard`'s geometry. */
export function PropertyCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white",
        className
      )}
    >
      <Skeleton className="aspect-[4/3] w-full rounded-none bg-gray-200/70" />
      <div className="flex flex-col gap-3 p-5 sm:p-6">
        <div className="space-y-2">
          <Skeleton className="h-6 w-2/5" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3.5 w-1/2" />
        </div>
        <div className="flex gap-5 border-t border-gray-100 pt-4">
          <Skeleton className="h-3.5 w-14" />
          <Skeleton className="h-3.5 w-14" />
          <Skeleton className="h-3.5 w-16" />
        </div>
      </div>
    </div>
  );
}

/** Filter bar + grid of listing cards — used by `/properties`. */
export function PropertyGridSkeleton({
  count = 6,
  withFilters = true,
}: {
  count?: number;
  withFilters?: boolean;
}) {
  return (
    <section className="py-12">
      <StatusLabel text="Loading listings" />
      <Container>
        {withFilters && (
          <div
            aria-hidden="true"
            className="mb-10 flex flex-col items-center justify-between gap-4 rounded-lg border border-gray-200 bg-white p-4 md:flex-row"
          >
            <Skeleton className="h-12 w-full md:w-96" />
            <div className="flex w-full gap-2 md:w-auto">
              <Skeleton className="h-10 w-28" />
              <Skeleton className="h-10 w-28" />
            </div>
          </div>
        )}

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: count }).map((_, index) => (
            <PropertyCardSkeleton key={index} />
          ))}
        </div>
      </Container>
    </section>
  );
}

/** Generic marketing-page placeholder: headline block, then three cards. */
export function SitePageSkeleton() {
  return (
    <div>
      <StatusLabel text="Loading page" />
      <section className="border-b border-gray-100 bg-background-soft py-16">
        <Container>
          <div aria-hidden="true" className="max-w-3xl space-y-4">
            <Skeleton className="h-3.5 w-40" />
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-10 w-1/2" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </Container>
      </section>

      <section className="py-16">
        <Container>
          <div aria-hidden="true" className="mx-auto mb-12 max-w-2xl space-y-4 text-center">
            <Skeleton className="mx-auto h-3.5 w-32" />
            <Skeleton className="mx-auto h-8 w-2/3" />
            <Skeleton className="mx-auto h-4 w-1/2" />
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                aria-hidden="true"
                className="space-y-5 rounded-xl border border-gray-200 bg-white p-8"
              >
                <Skeleton className="h-6 w-6 rounded-md" />
                <Skeleton className="h-6 w-2/3" />
                <Skeleton className="h-3.5 w-full" />
                <Skeleton className="h-3.5 w-5/6" />
              </div>
            ))}
          </div>
        </Container>
      </section>
    </div>
  );
}

/** Placeholder rows for a portal data table. */
export function PortalTableSkeleton({
  rows = 6,
  columns = 5,
}: {
  rows?: number;
  columns?: number;
}) {
  return (
    <div aria-hidden="true" className="overflow-hidden">
      <div className="grid gap-3 border-b border-gray-100 pb-3" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
        {Array.from({ length: columns }).map((_, index) => (
          <Skeleton key={`head-${index}`} className="h-2.5 w-2/3" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          key={`row-${rowIndex}`}
          className="grid gap-3 border-b border-gray-50 py-4 last:border-b-0"
          style={
            {
              gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
              // Staggered shimmer phase so rows shimmer as a wave, not in lockstep.
              "--shimmer-delay": `-${(rowIndex % 6) * 0.15}s`,
            } as CSSProperties
          }
        >
          {Array.from({ length: columns }).map((_, cellIndex) => (
            <Skeleton
              key={`cell-${cellIndex}`}
              className={cn("h-3.5", cellIndex === 0 ? "w-4/5" : "w-3/5")}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

/** Full portal page placeholder: heading, toolbar, then a table or cards. */
export function PortalPageSkeleton({ variant = "table" }: { variant?: "table" | "cards" }) {
  return (
    <div className="animate-fade-in space-y-6">
      <StatusLabel text="Loading portal page" />

      {/* Page heading: title + description on the left, actions on the right. */}
      <div aria-hidden="true" className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2.5">
          <Skeleton className="h-7 w-52" />
          <Skeleton className="h-4 w-80 max-w-full" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-11 w-28" />
          <Skeleton className="h-11 w-28" />
        </div>
      </div>

      {/* Filter toolbar: search + segmented filter + primary action. */}
      <div aria-hidden="true" className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          <Skeleton className="h-12 w-full sm:max-w-xs" />
          <Skeleton className="h-10 w-full sm:w-56" />
        </div>
        <Skeleton className="h-11 w-40" />
      </div>

      {/* Content card mirroring the portal `Card` (header + body). */}
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <div aria-hidden="true" className="space-y-2 border-b border-gray-200 px-5 py-4">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-3.5 w-64 max-w-full" />
        </div>
        <div className="p-5">
          {variant === "table" ? (
            <PortalTableSkeleton />
          ) : (
            <div aria-hidden="true" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="h-28 w-full rounded-lg" />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
