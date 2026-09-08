"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { Container } from "@/components/ui/container";
import { ListingGrid } from "@/components/ui/listing-grid";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { Property } from "@/types";

export function BuyListings({ properties }: { properties: Property[] }) {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("default");
  const deferredSearch = useDeferredValue(search);

  const filtered = useMemo(() => {
    const needle = deferredSearch.trim().toLowerCase();
    return properties
      .filter((p) => p.type === "sale")
      .filter(
        (p) =>
          needle.length === 0 ||
          p.name.toLowerCase().includes(needle) ||
          p.location.toLowerCase().includes(needle)
      )
      .sort((a, b) => {
        if (sort === "price-low") return a.price - b.price;
        if (sort === "price-high") return b.price - a.price;
        return 0;
      });
  }, [properties, deferredSearch, sort]);

  function reset() {
    setSearch("");
    setSort("default");
  }

  return (
    <section id="buy-listings" className="scroll-mt-24 py-12">
      <Container>
        <div className="mb-6 flex flex-col items-start justify-between gap-4 rounded-lg border border-gray-200 bg-white p-4 sm:flex-row sm:items-center">
          <div className="relative w-full sm:w-80">
            <Input
              placeholder="Search by title or location..."
              className="peer pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search properties for sale by title or location"
            />
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500 transition-colors duration-200 peer-focus:text-primary"
              aria-hidden="true"
            />
          </div>

          <label className="flex items-center gap-3 text-sm font-medium text-gray-600">
            Sort by
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="h-12 cursor-pointer rounded-md border border-gray-500 bg-white px-4 text-base font-medium text-dark transition-colors duration-200 hover:border-gray-700 focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10"
            >
              <option value="default">Featured</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
            </select>
          </label>
        </div>

        <p className="mb-8 text-sm font-medium text-gray-600" aria-live="polite">
          Showing <span className="font-semibold text-dark">{filtered.length}</span>{" "}
          {filtered.length === 1 ? "property" : "properties"} for sale
        </p>

        <ListingGrid
          properties={filtered}
          stale={deferredSearch !== search}
          empty={{
            title: "No properties found",
            description: "Try a different location or title, or clear the search to see every property for sale.",
            actionLabel: "Clear search",
            onAction: reset,
          }}
        />
      </Container>
    </section>
  );
}
