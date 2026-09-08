"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { SegmentedControl } from "@/components/ui/segmented-control";

interface PropertyFiltersProps {
  search: string;
  setSearch: (val: string) => void;
  type: string;
  setType: (val: string) => void;
}

/**
 * Search + type filter for the listings grid. Only controls that do something
 * are rendered — there is no placeholder "Advanced" button.
 */
export function PropertyFilters({ search, setSearch, type, setType }: PropertyFiltersProps) {
  const types = [
    { label: "All Types", value: "all" },
    { label: "For Sale", value: "sale" },
    { label: "For Rent", value: "rent" },
  ];

  return (
    <div className="flex flex-col items-center justify-between gap-4 rounded-lg border border-gray-200 bg-white p-4 md:flex-row">
      <div className="relative w-full md:w-96">
        <Input
          placeholder="Search location or title..."
          className="peer pl-10"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search listings by location or title"
        />
        {/* Absolutely positioned, so DOM order is free — it sits *after* the
            input so `peer-focus` can tint it when the field is focused. */}
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500 transition-colors duration-200 peer-focus:text-primary"
          aria-hidden="true"
        />
      </div>

      <SegmentedControl
        options={types}
        value={type}
        onChange={setType}
        label="Filter listings by type"
        className="w-full md:w-auto"
      />
    </div>
  );
}
