"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export function CTASection() {
  return (
    <section className="py-24">
      <Container>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="relative bg-primary rounded-[2rem] overflow-hidden p-12 md:p-20 text-center text-white"
        >
          {/* Decorative elements */}
          <div className="absolute top-0 left-0 w-64 h-64 bg-white/10 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary-dark/50 rounded-full translate-x-1/3 translate-y-1/3 blur-3xl" />

          <div className="relative z-10 max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-5xl font-extrabold font-heading mb-6 leading-tight">
              Not sure where to start?
            </h2>
            <p className="text-lg text-white/90 mb-10 leading-relaxed max-w-2xl mx-auto">
              Send us a message describing what you want to do. We will reply with a
              plain explanation of the options, the process and the cost, with no
              obligation to proceed.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/contact">
                <Button size="lg" className="bg-white text-primary hover:bg-gray-100 px-10 gap-2 font-bold">
                  Message us
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
              <Link href="/properties">
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-primary px-10 font-bold">
                  Browse listings
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>
      </Container>
    </section>
  );
}
