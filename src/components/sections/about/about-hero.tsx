"use client";

import { motion } from "framer-motion";
import { Container } from "@/components/ui/container";

export function AboutHero() {
  return (
    <section className="relative py-20 bg-dark text-white overflow-hidden">
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(#2563EB_1px,transparent_1px)] [background-size:40px_40px]" />
      </div>
      
      <Container className="relative z-10 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <span className="text-primary-light font-bold tracking-widest uppercase text-sm mb-4 block">
            About MCBHLUES Enterprises
          </span>
          <h1 className="text-4xl md:text-6xl font-extrabold font-heading mb-6">
            A real estate team that stays <br /> with your project
          </h1>
          <p className="max-w-2xl mx-auto text-gray-400 text-lg leading-relaxed">
            We advise buyers and investors, develop residential and commercial
            property, and manage buildings and facilities. The people you meet at
            the start are the ones who carry the job through to the end.
          </p>
        </motion.div>
      </Container>
    </section>
  );
}
