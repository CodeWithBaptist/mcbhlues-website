"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { Container } from "@/components/ui/container";
import { ListingGrid } from "@/components/ui/listing-grid";
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
  const hasFilters = search.length > 0 || type !== "all";

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

        <div className="mb-8 mt-6 flex items-center justify-between gap-4">
          {/* Announced politely so screen-reader users hear the new total. */}
          <p aria-live="polite" className="text-sm font-medium text-gray-600">
            Showing <span className="font-semibold text-dark">{filteredProperties.length}</span>{" "}
            {filteredProperties.length === 1 ? "property" : "properties"}
          </p>
          {hasFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="text-sm font-semibold text-gray-700 underline-offset-4 transition-colors duration-200 hover:text-primary hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              Clear filters
            </button>
          )}
        </div>

        <ListingGrid
          properties={filteredProperties}
          stale={isStale}
          empty={{
            title: "No properties found",
            description: (
              <>
                Nothing matches &ldquo;{search || "your filters"}&rdquo; right now. Try a
                different location, or clear the filters to see everything.
              </>
            ),
            actionLabel: "Clear filters",
            onAction: resetFilters,
          }}
        />
      </Container>
    </section>
  );
}
