"use client";

import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { useHydrated } from "@/lib/consent";
import { toggleFavorite, useIsFavorite } from "@/lib/favorites";

/**
 * Heart toggle for saving a listing to the browser-local favourites list.
 *
 * Rendered *outside* the card's link (see `PropertyCard`) — a button nested
 * inside an anchor is invalid HTML and unusable with a keyboard.
 */
export function SaveButton({
  propertyId,
  propertyName,
  className,
}: {
  propertyId: string;
  propertyName: string;
  className?: string;
}) {
  const hydrated = useHydrated();
  const saved = useIsFavorite(propertyId);

  // Before hydration the real state is unknown (it lives in localStorage), so
  // render the control disabled rather than flashing the wrong icon.
  const label = saved
    ? `Remove ${propertyName} from your saved properties`
    : `Save ${propertyName} to your saved properties`;

  return (
    <button
      type="button"
      onClick={() => toggleFavorite(propertyId)}
      disabled={!hydrated}
      aria-pressed={hydrated ? saved : undefined}
      aria-label={label}
      title={hydrated ? label : "Save this property"}
      className={cn(
        "inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/95 text-gray-700 shadow-md transition",
        "hover:bg-white hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
        "disabled:cursor-default disabled:opacity-70",
        saved && "text-primary",
        className
      )}
    >
      <Heart
        className={cn("h-5 w-5 transition-transform", saved && "scale-110 fill-primary")}
        aria-hidden="true"
      />
    </button>
  );
}
