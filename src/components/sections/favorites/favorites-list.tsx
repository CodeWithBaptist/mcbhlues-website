"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Heart } from "lucide-react";
import { Container } from "@/components/ui/container";
import { PropertyCard } from "@/components/ui/property-card";
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
      <section className="py-24">
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
      <section className="py-24 text-center">
        <Container>
          <div className="mx-auto max-w-md">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Heart className="h-10 w-10" aria-hidden="true" />
            </div>
            <h2 className="mb-4 font-heading text-3xl font-bold text-dark">No saved properties yet</h2>
            <p className="mb-8 text-gray-600">
              Tap the heart on any listing to save it here. Your list is kept in
              this browser only — we never see it.
            </p>
            <Link
              href="/properties"
              className={buttonClasses({
                size: "lg",
                className: "gap-2",
              })}
            >
              Browse Properties
              <ArrowRight className="h-5 w-5" aria-hidden="true" />
            </Link>
          </div>
        </Container>
      </section>
    );
  }

  return (
    <section className="py-12">
      <Container>
        <div className="mb-12 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Heart className="h-6 w-6 fill-primary" aria-hidden="true" />
            </div>
            <div>
              <h2 className="font-heading text-3xl font-bold text-dark">Your saved properties</h2>
              <p className="text-sm text-gray-600">
                {savedProperties.length}{" "}
                {savedProperties.length === 1 ? "listing" : "listings"} saved in this browser
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={clearFavorites}
            className="rounded-lg px-3 py-2 text-sm font-semibold text-gray-700 underline underline-offset-4 transition hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            Clear all
          </button>
        </div>

        <div
          className="grid gap-8 md:grid-cols-2 lg:grid-cols-3"
          aria-live="polite"
        >
          {savedProperties.map((property, index) => (
            <motion.div
              key={property.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: Math.min(index, 5) * 0.05 }}
            >
              <PropertyCard property={property} priority={index < 3} />
            </motion.div>
          ))}
        </div>

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
