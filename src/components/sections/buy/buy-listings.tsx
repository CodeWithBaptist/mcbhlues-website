"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Container } from "@/components/ui/container";
import { PropertyCard } from "@/components/ui/property-card";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { DUMMY_PROPERTIES } from "@/constants";

export function BuyListings() {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("default");

  const saleProperties = DUMMY_PROPERTIES.filter((p) => p.type === "sale");

  const filtered = saleProperties
    .filter(
      (p) =>
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        p.location.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      if (sort === "price-low") return a.price - b.price;
      if (sort === "price-high") return b.price - a.price;
      return 0;
    });

  return (
    <section id="buy-listings" className="py-12">
      <Container>
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-10 p-6 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search by title or location..."
              className="pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500 font-medium">Sort by:</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="px-4 py-2.5 text-sm font-semibold border border-gray-200 rounded-lg bg-white text-dark focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all cursor-pointer"
            >
              <option value="default">Featured</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
            </select>
          </div>
        </div>

        <p className="text-gray-500 font-medium mb-8">
          Showing <span className="text-dark font-bold">{filtered.length}</span> properties for sale
        </p>

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
                <h3 className="text-2xl font-bold text-dark mb-2">No properties found</h3>
                <p className="text-gray-500">Try adjusting your search criteria.</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </Container>
    </section>
  );
}
