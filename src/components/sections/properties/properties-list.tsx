"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SearchX } from "lucide-react";
import { Container } from "@/components/ui/container";
import { PropertyCard } from "@/components/ui/property-card";
import { Property } from "@/types";
import { PropertyFilters } from "./property-filters";

export function PropertiesList({ properties }: { properties: Property[] }) {
  const [search, setSearch] = useState("");
  const [type, setType] = useState("all");
  // Filtering a long catalogue on every keystroke blocks typing on slow devices;
  // deferring keeps the input responsive and filters a frame later.
  const deferredSearch = useDeferredValue(search);

  const filteredProperties = useMemo(() => {
    const needle = deferredSearch.trim().toLowerCase();
    return properties.filter((p) => {
      const matchesSearch =
        needle.length === 0 ||
        p.name.toLowerCase().includes(needle) ||
        p.location.toLowerCase().includes(needle);
      const matchesType = type === "all" || p.type === type;
      return matchesSearch && matchesType;
    });
  }, [properties, deferredSearch, type]);

  const isStale = deferredSearch !== search;

  function resetFilters() {
    setSearch("");
    setType("all");
  }

  return (
    <section className="py-12">
      <Container>
        <PropertyFilters
          search={search}
          setSearch={setSearch}
          type={type}
          setType={setType}
        />

        <div className="mb-8 flex items-center justify-between gap-4">
          {/* Announced politely so screen-reader users hear the new total. */}
          <p aria-live="polite" className="font-medium text-gray-600">
            Showing <span className="font-bold text-dark">{filteredProperties.length}</span>{" "}
            {filteredProperties.length === 1 ? "property" : "properties"}
          </p>
          {(search || type !== "all") && (
            <button
              type="button"
              onClick={resetFilters}
              className="rounded-lg px-3 py-2 text-sm font-semibold text-gray-700 underline-offset-4 transition-colors duration-200 hover:text-primary hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              Clear filters
            </button>
          )}
        </div>

        <div
          className="grid gap-8 md:grid-cols-2 lg:grid-cols-3"
          /* Slightly dimmed while a deferred filter is still catching up. */
          data-stale={isStale ? "true" : "false"}
        >
          <AnimatePresence mode="popLayout">
            {filteredProperties.length > 0 ? (
              filteredProperties.map((property, index) => (
                <motion.div
                  key={property.id}
                  layout
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                >
                  {/* The first row is above the fold — fetch it eagerly. */}
                  <PropertyCard property={property} priority={index < 3} />
                </motion.div>
              ))
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="col-span-full py-20 text-center"
              >
                <div
                  className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary"
                  aria-hidden="true"
                >
                  <SearchX className="h-8 w-8" />
                </div>
                <h3 className="mb-2 text-2xl font-bold text-dark">No properties found</h3>
                <p className="mx-auto mb-6 max-w-md text-gray-600">
                  Nothing matches &ldquo;{search || "your filters"}&rdquo; right now. Try a
                  different location, or clear the filters to see everything.
                </p>
                <button
                  type="button"
                  onClick={resetFilters}
                  className="rounded-md border-2 border-primary px-6 py-2.5 text-base font-semibold text-primary transition-all duration-200 hover:bg-primary hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:translate-y-px"
                >
                  Clear filters
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Container>
    </section>
  );
}
