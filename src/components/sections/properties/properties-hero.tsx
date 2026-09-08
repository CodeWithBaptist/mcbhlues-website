"use client";

import { motion } from "framer-motion";
import { Container } from "@/components/ui/container";

export function PropertiesHero() {
  return (
    <section className="bg-background-soft py-16 border-b border-gray-100">
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-3xl"
        >
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-primary">
            Current Listings
          </p>
          <h1 className="mb-4 font-heading text-4xl font-bold tracking-tight text-dark md:text-5xl">
            Browse property for sale and rent
          </h1>
          <p className="text-lg leading-relaxed text-gray-600">
            Filter the list below by type, title or location. Select any listing to
            see the full details and arrange a viewing.
          </p>
        </motion.div>
      </Container>
    </section>
  );
}
