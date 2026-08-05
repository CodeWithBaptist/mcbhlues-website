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
            Who We Are
          </span>
          <h1 className="text-4xl md:text-6xl font-extrabold font-heading mb-6">
            Leading the Future of <br /> Luxury Real Estate
          </h1>
          <p className="max-w-2xl mx-auto text-gray-400 text-lg leading-relaxed">
            MCBHLUES ENTERPRISES is a premier real estate firm dedicated to providing 
            unparalleled services in property development, consulting, and management.
          </p>
        </motion.div>
      </Container>
    </section>
  );
}
