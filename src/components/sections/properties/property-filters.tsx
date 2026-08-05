"use client";

import { Search, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface PropertyFiltersProps {
  search: string;
  setSearch: (val: string) => void;
  type: string;
  setType: (val: string) => void;
}

export function PropertyFilters({ search, setSearch, type, setType }: PropertyFiltersProps) {
  const types = [
    { label: "All Types", value: "all" },
    { label: "For Sale", value: "sale" },
    { label: "For Rent", value: "rent" },
  ];

  return (
    <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-10 p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
      <div className="relative w-full md:w-96">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Search location or title..."
          className="pl-10"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="flex items-center gap-2 w-full md:w-auto">
        <div className="flex p-1 bg-gray-100 rounded-lg w-full md:w-auto">
          {types.map((t) => (
            <button
              key={t.value}
              onClick={() => setType(t.value)}
              className={`px-4 py-2 text-sm font-semibold rounded-md transition-all ${
                type === t.value
                  ? "bg-white text-primary shadow-sm"
                  : "text-gray-500 hover:text-dark"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        
        <Button variant="outline" size="sm" className="hidden md:flex gap-2 shrink-0">
          <SlidersHorizontal className="w-4 h-4" />
          Advanced
        </Button>
      </div>
    </div>
  );
}
