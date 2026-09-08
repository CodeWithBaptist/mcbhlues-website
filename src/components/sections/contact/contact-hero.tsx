"use client";

import { motion } from "framer-motion";
import { Container } from "@/components/ui/container";

export function ContactHero() {
  return (
    <section className="bg-dark py-20 text-white sm:py-24">
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-3xl"
        >
          <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-primary-light">
            Contact us
          </p>
          <h1 className="mb-6 font-heading text-4xl font-bold leading-[1.1] tracking-tight md:text-5xl lg:text-6xl">
            Tell us what you are planning
          </h1>
          <p className="max-w-2xl text-lg leading-relaxed text-gray-300">
            Buying, selling, developing or managing a property. Send us a message
            and a consultant will reply with the next steps, what it involves and
            what it costs.
          </p>
        </motion.div>
      </Container>
    </section>
  );
}
