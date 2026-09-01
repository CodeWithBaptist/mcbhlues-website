"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Container } from "@/components/ui/container";
import { PropertyCard } from "@/components/ui/property-card";
import { Property } from "@/types";
import { PropertyFilters } from "./property-filters";

export function PropertiesList({ properties }: { properties: Property[] }) {
  const [search, setSearch] = useState("");
  const [type, setType] = useState("all");

  const filteredProperties = properties.filter((p) => {
    const matchesSearch = 
      p.title.toLowerCase().includes(search.toLowerCase()) || 
      p.location.toLowerCase().includes(search.toLowerCase());
    const matchesType = type === "all" || p.type === type;
    return matchesSearch && matchesType;
  });

  return (
    <section className="py-12">
      <Container>
        <PropertyFilters 
          search={search} 
          setSearch={setSearch} 
          type={type} 
          setType={setType} 
        />

        <div className="flex justify-between items-center mb-8">
          <p className="text-gray-500 font-medium">
            Showing <span className="text-dark font-bold">{filteredProperties.length}</span> properties
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <AnimatePresence mode="popLayout">
            {filteredProperties.length > 0 ? (
              filteredProperties.map((property) => (
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
                <p className="text-gray-500">Try adjusting your filters or search keywords.</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </Container>
    </section>
  );
}
