import { cn } from "@/lib/utils";

/**
 * Placeholder block for content that is still loading.
 *
 * Purely decorative: it is removed from the accessibility tree and paired with
 * a `role="status"` live region by the surrounding skeleton so screen-reader
 * users hear "loading" once instead of a wall of empty boxes.
 */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn("shimmer rounded-md bg-gray-200/90", className)}
    />
  );
}

/** Single-line text placeholder; pass `className="w-2/3"` to vary the length. */
export function SkeletonText({ className }: { className?: string }) {
  return <Skeleton className={cn("h-3.5 w-full", className)} />;
}
