"use client";

import { motion } from "framer-motion";
import { Container } from "@/components/ui/container";

export function AboutHero() {
  return (
    <section className="bg-dark py-20 text-white sm:py-24">
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-3xl"
        >
          <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-primary-light">
            About MCBHLUES Enterprises
          </p>
          <h1 className="mb-6 font-heading text-4xl font-bold leading-[1.1] tracking-tight md:text-5xl lg:text-6xl">
            A real estate team that stays with your project
          </h1>
          <p className="max-w-2xl text-lg leading-relaxed text-gray-300">
            We advise buyers and investors, develop residential and commercial
            property, and manage buildings and facilities. The people you meet at
            the start are the ones who carry the job through to the end.
          </p>
        </motion.div>
      </Container>
    </section>
  );
}
