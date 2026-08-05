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
            <span className="inline-block px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-bold tracking-wider uppercase mb-6">
              Premium Rentals
            </span>
            <h1 className="text-4xl md:text-6xl font-extrabold font-heading text-dark leading-tight mb-6">
              Experience Luxury <br />
              <span className="text-primary">Without Commitment</span>
            </h1>
            <p className="text-xl text-gray-600 leading-relaxed mb-10 max-w-xl">
              From high-end penthouses to modern commercial spaces, find the perfect 
              rental that fits your lifestyle and business needs.
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
               <div className="w-full h-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center">
                  <Key className="w-32 h-32 text-white/20" />
               </div>
            </div>
            {/* Overlay card */}
            <div className="absolute -bottom-6 -left-6 bg-white p-6 rounded-2xl shadow-xl border border-gray-100 max-w-[200px]">
               <p className="text-xs font-bold text-primary uppercase mb-1">New Listing</p>
               <p className="font-bold text-dark">Harbor View Suite</p>
               <p className="text-sm text-gray-500">$3,200/mo</p>
            </div>
          </motion.div>
        </div>
      </Container>
    </section>
  );
}
