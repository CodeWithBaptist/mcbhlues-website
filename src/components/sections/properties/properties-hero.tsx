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
          <span className="text-primary font-bold tracking-widest uppercase text-sm mb-3 block">
            Our Portfolio
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold font-heading text-dark mb-4">
            Find Your Dream Property
          </h1>
          <p className="text-gray-600 text-lg leading-relaxed">
            Browse our exclusive collection of luxury residences, commercial spaces, 
            and premium land developments.
          </p>
        </motion.div>
      </Container>
    </section>
  );
}
