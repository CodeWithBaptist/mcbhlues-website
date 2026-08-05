"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Container } from "@/components/ui/container";
import { PropertyCard } from "@/components/ui/property-card";
import { Input } from "@/components/ui/input";
import { Search, Filter } from "lucide-react";
import { DUMMY_PROPERTIES } from "@/constants";

export function RentListings() {
  const [search, setSearch] = useState("");
  
  const rentalProperties = DUMMY_PROPERTIES.filter((p) => p.type === "rent");

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
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search rental locations..."
              className="pl-10 bg-white"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          
          <div className="flex items-center gap-4 w-full md:w-auto">
             <p className="text-sm font-medium text-gray-500 whitespace-nowrap">
                Found <span className="text-dark font-bold">{filtered.length}</span> rentals
             </p>
             <div className="h-4 w-px bg-gray-300 hidden md:block" />
             <button className="flex items-center gap-2 text-sm font-bold text-primary hover:text-primary-dark transition-colors">
                <Filter className="w-4 h-4" />
                More Filters
             </button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <AnimatePresence mode="popLayout">
            {filtered.length > 0 ? (
              filtered.map((property) => (
                <motion.div
                  key={property.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                >
                  <PropertyCard property={property} />
                </motion.div>
              ))
            ) : (
              <div className="col-span-full py-20 text-center">
                <h3 className="text-2xl font-bold text-dark mb-2">No rentals matching your search</h3>
                <p className="text-gray-500">Try broadening your search or check back later.</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </Container>
    </section>
  );
}
