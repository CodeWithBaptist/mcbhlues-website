"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { Container } from "@/components/ui/container";
import { ListingGrid } from "@/components/ui/listing-grid";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { Property } from "@/types";

export function RentListings({ properties }: { properties: Property[] }) {
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);

  const filtered = useMemo(() => {
    const needle = deferredSearch.trim().toLowerCase();
    return properties
      .filter((p) => p.type === "rent")
      .filter(
        (p) =>
          needle.length === 0 ||
          p.name.toLowerCase().includes(needle) ||
          p.location.toLowerCase().includes(needle)
      );
  }, [properties, deferredSearch]);

  return (
    <section id="rent-listings" className="scroll-mt-24 bg-background-soft py-12">
      <Container>
        <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div className="relative w-full sm:w-96">
            <Input
              placeholder="Search rental locations..."
              className="peer pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search rentals by title or location"
            />
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500 transition-colors duration-200 peer-focus:text-primary"
              aria-hidden="true"
            />
          </div>

          <p className="text-sm font-medium text-gray-600" aria-live="polite">
            Showing <span className="font-semibold text-dark">{filtered.length}</span>{" "}
            {filtered.length === 1 ? "rental" : "rentals"}
          </p>
        </div>

        <ListingGrid
          properties={filtered}
          stale={deferredSearch !== search}
          empty={{
            title: "No rentals match your search",
            description: "Try a different location, or clear the search to see every rental.",
            actionLabel: "Clear search",
            onAction: () => setSearch(""),
          }}
        />
      </Container>
    </section>
  );
}
