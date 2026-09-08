"use client";

import { AnimatePresence, motion } from "framer-motion";
import { SearchX } from "lucide-react";
import { buttonClasses } from "@/components/ui/button";
import { PropertyCard } from "@/components/ui/property-card";
import { Property } from "@/types";

interface ListingGridProps {
  properties: Property[];
  /** True while a deferred filter is still catching up — the grid dims slightly. */
  stale?: boolean;
  /** Copy and reset action for the "nothing matches" state. Omit when the
   *  caller renders its own empty state before reaching the grid. */
  empty?: {
    title: string;
    description: React.ReactNode;
    actionLabel: string;
    onAction: () => void;
  };
}

/**
 * The one listings grid used by every public catalogue view (all properties,
 * buy, rent, favourites). Cards render immediately on first paint — only
 * filter changes animate — and the empty state is the same everywhere.
 */
export function ListingGrid({ properties, stale = false, empty }: ListingGridProps) {
  return (
    <div
      className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 lg:gap-8"
      data-stale={stale ? "true" : "false"}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        {properties.length > 0 ? (
          properties.map((property, index) => (
            <motion.div
              key={property.id}
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            >
              {/* The first row is above the fold — fetch it eagerly. */}
              <PropertyCard property={property} priority={index < 3} />
            </motion.div>
          ))
        ) : empty ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="col-span-full rounded-xl border border-dashed border-gray-300 px-6 py-16 text-center"
          >
            <SearchX className="mx-auto mb-5 h-8 w-8 text-gray-400" aria-hidden="true" />
            <h3 className="mb-2 font-heading text-xl font-bold text-dark">{empty.title}</h3>
            <p className="mx-auto mb-6 max-w-md text-gray-600">{empty.description}</p>
            <button
              type="button"
              onClick={empty.onAction}
              className={buttonClasses({ variant: "outline", size: "sm" })}
            >
              {empty.actionLabel}
            </button>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
