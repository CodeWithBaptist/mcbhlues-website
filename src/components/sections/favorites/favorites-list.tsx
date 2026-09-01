"use client";

import { motion } from "framer-motion";
import { Container } from "@/components/ui/container";
import { PropertyCard } from "@/components/ui/property-card";
import { Heart, ArrowRight } from "lucide-react";
import { Property } from "@/types";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function FavoritesList({ properties }: { properties: Property[] }) {
  // Favourites are not yet persisted on the backend — we showcase a curated
  // "saved" set from the published listings to demonstrate the UI.
  const savedProperties = properties.slice(0, 2);

  if (savedProperties.length === 0) {
    return (
      <section className="py-24 text-center">
        <Container>
          <div className="max-w-md mx-auto">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-primary mx-auto mb-6">
              <Heart className="w-10 h-10" />
            </div>
            <h2 className="text-3xl font-bold text-dark mb-4 font-heading">No Favorites Yet</h2>
            <p className="text-gray-500 mb-8">
              Start exploring our premium properties and click the heart icon to save the ones you love.
            </p>
            <Link href="/properties">
              <Button size="lg" className="gap-2">
                Browse Properties
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
          </div>
        </Container>
      </section>
    );
  }

  return (
    <section className="py-12">
      <Container>
        <div className="flex items-center gap-4 mb-12">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <Heart className="w-6 h-6 fill-primary" />
          </div>
          <h2 className="text-3xl font-bold text-dark font-heading">Your Saved Properties</h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {savedProperties.map((property, index) => (
            <motion.div
              key={property.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
            >
              <PropertyCard property={property} />
            </motion.div>
          ))}
        </div>
      </Container>
    </section>
  );
}
