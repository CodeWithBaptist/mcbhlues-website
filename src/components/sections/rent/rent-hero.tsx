"use client";

import { motion } from "framer-motion";
import { Key, ShieldCheck, Clock } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function RentHero() {
  return (
    <section className="relative py-20 md:py-32 bg-primary-soft overflow-hidden">
      {/* Decorative background */}
      <div className="absolute top-0 right-0 w-1/3 h-full bg-primary/5 -skew-x-12 translate-x-1/4" />
      <div className="absolute top-20 left-10 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />

      <Container className="relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <span className="inline-block px-4 py-2 border border-primary/20 text-primary text-sm font-semibold tracking-wide uppercase mb-6">
              Residential and commercial rentals
            </span>
            <h1 className="text-4xl md:text-6xl font-extrabold font-heading text-dark leading-tight mb-6">
              Rent homes and <br />
              <span className="text-primary">workspace</span>
            </h1>
            <p className="text-xl text-gray-600 leading-relaxed mb-10 max-w-xl">
              Search residential and commercial spaces, check the monthly rent and
              the terms, and arrange a viewing. Every lease is reviewed by our
              team before you sign.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="#rent-listings">
                <Button size="lg" className="px-8">Find a Rental</Button>
              </Link>
              <Link href="/contact">
                <Button size="lg" variant="outline" className="px-8">List Your Property</Button>
              </Link>
            </div>

            <div className="mt-12 flex gap-8">
               <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-primary" />
                  <span className="text-sm font-bold text-dark">Vetted Listings</span>
               </div>
               <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" />
                  <span className="text-sm font-bold text-dark">Flexible Terms</span>
               </div>
               <div className="flex items-center gap-2">
                  <Key className="w-5 h-5 text-primary" />
                  <span className="text-sm font-bold text-dark">Instant Viewing</span>
               </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="hidden lg:block relative"
          >
            <div className="aspect-[4/3] rounded-[2rem] bg-white shadow-2xl overflow-hidden border-8 border-white">
              <div className="relative h-full w-full">
                {/* eslint-disable-next-line @next/next/no-img-element -- editorial imagery placeholder */}
                <img
                  src="https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1400&q=80"
                  alt="Apartment interior available to rent through MCBHLUES Enterprises"
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
          </motion.div>
        </div>
      </Container>
    </section>
  );
}
