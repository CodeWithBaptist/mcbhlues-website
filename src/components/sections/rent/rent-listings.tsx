"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Container } from "@/components/ui/container";
import { PropertyCard } from "@/components/ui/property-card";
import { Input } from "@/components/ui/input";
import { Filter, Search, SearchX } from "lucide-react";
import { Property } from "@/types";

export function RentListings({ properties }: { properties: Property[] }) {
  const [search, setSearch] = useState("");
  
  const rentalProperties = properties.filter((p) => p.type === "rent");

  const filtered = rentalProperties.filter(
    (p) =>
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.location.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <section id="rent-listings" className="py-12 bg-background-soft">
      <Container>
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-10">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <Input
              placeholder="Search rental locations..."
              className="pl-10 bg-white"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          
          <div className="flex items-center gap-4 w-full md:w-auto">
             <p className="text-sm font-medium text-gray-600 whitespace-nowrap" aria-live="polite">
                Found <span className="text-dark font-bold">{filtered.length}</span> rentals
             </p>
             <div className="h-4 w-px bg-gray-300 hidden md:block" />
             <button
                type="button"
                className="flex items-center gap-2 text-sm font-bold text-primary underline-offset-4 transition-colors duration-200 hover:text-primary-dark hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
             >
                <Filter className="w-4 h-4" aria-hidden="true" />
                More Filters
             </button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <AnimatePresence mode="popLayout">
            {filtered.length > 0 ? (
              filtered.map((property, index) => (
                <motion.div
                  key={property.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3 }}
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
                <h3 className="text-2xl font-bold text-dark mb-2">No rentals matching your search</h3>
                <p className="text-gray-600 mb-6">Try broadening your search or check back later.</p>
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="rounded-md border-2 border-primary px-6 py-2.5 text-base font-semibold text-primary transition-all duration-200 hover:bg-primary hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:translate-y-px"
                >
                  Clear search
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Container>
    </section>
  );
}
