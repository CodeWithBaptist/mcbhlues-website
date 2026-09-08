"use client";

import Link from "next/link";
import { ArrowRight, Heart } from "lucide-react";
import { Container } from "@/components/ui/container";
import { ListingGrid } from "@/components/ui/listing-grid";
import { PropertyCardSkeleton } from "@/components/ui/skeletons";
import { buttonClasses } from "@/components/ui/button";
import { useHydrated } from "@/lib/consent";
import { clearFavorites, useFavorites } from "@/lib/favorites";
import { Property } from "@/types";

/**
 * Renders the visitor's saved listings.
 *
 * The full published catalogue is passed in from the server and filtered
 * client-side against the ids in localStorage, so the saved list itself is
 * never sent to us — which is what the privacy policy promises.
 */
export function FavoritesList({ properties }: { properties: Property[] }) {
  const hydrated = useHydrated();
  const savedIds = useFavorites();

  // Preserve the saved order (newest first) rather than the catalogue order.
  const byId = new Map(properties.map((property) => [property.id, property]));
  const savedProperties = savedIds
    .map((id) => byId.get(id))
    .filter((property): property is Property => Boolean(property));

  // localStorage is unreadable on the server, so the first paint must not claim
  // the list is empty. Show neutral placeholders until hydration finishes.
  if (!hydrated) {
    return (
      <section className="py-12 sm:py-16">
        <Container>
          <p className="sr-only" role="status">
            Loading your saved properties
          </p>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3" aria-hidden="true">
            <PropertyCardSkeleton />
            <PropertyCardSkeleton className="hidden md:block" />
            <PropertyCardSkeleton className="hidden lg:block" />
          </div>
        </Container>
      </section>
    );
  }

  if (savedProperties.length === 0) {
    return (
      <section className="py-16 text-center sm:py-24">
        <Container>
          <div className="mx-auto max-w-md">
            <Heart className="mx-auto mb-6 h-8 w-8 text-gray-400" aria-hidden="true" />
            <h2 className="mb-3 font-heading text-2xl font-bold text-dark">Nothing saved yet</h2>
            <p className="mb-8 text-gray-600">
              Tap the heart on any listing to keep it here for later.
            </p>
            <Link
              href="/properties"
              className={buttonClasses({
                size: "lg",
                className: "gap-2",
              })}
            >
              Browse properties
              <ArrowRight className="h-5 w-5" aria-hidden="true" />
            </Link>
          </div>
        </Container>
      </section>
    );
  }

  return (
    <section className="py-12 sm:py-16">
      <Container>
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <p className="text-sm text-gray-600" aria-live="polite">
            {savedProperties.length}{" "}
            {savedProperties.length === 1 ? "listing" : "listings"} saved
          </p>
          <button
            type="button"
            onClick={clearFavorites}
            className="text-sm font-semibold text-gray-700 underline-offset-4 transition-colors duration-200 hover:text-primary hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            Clear all
          </button>
        </div>

        {/* The empty state is handled above, before the grid renders. */}
        <ListingGrid properties={savedProperties} />

        <p className="mt-12 text-center text-gray-600">
          Ready to move on one of these?{" "}
          <Link
            href="/contact"
            className="font-semibold text-primary underline underline-offset-4 hover:text-primary-dark"
          >
            Talk to a consultant
          </Link>
          .
        </p>
      </Container>
    </section>
  );
}
