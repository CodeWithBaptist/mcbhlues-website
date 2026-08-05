"use client";

import { motion } from "framer-motion";
import { ArrowRight, ShieldCheck, TrendingUp, Award } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const highlights = [
  { icon: ShieldCheck, label: "Verified Listings" },
  { icon: TrendingUp, label: "High ROI Properties" },
  { icon: Award, label: "Premium Locations" },
];

export function BuyHero() {
  return (
    <section className="relative py-20 md:py-32 bg-dark text-white overflow-hidden">
      {/* Background patterns */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(#2563EB_1px,transparent_1px)] [background-size:32px_32px]" />
      </div>
      <div className="absolute -bottom-48 -right-48 w-[500px] h-[500px] bg-primary/20 rounded-full blur-3xl" />

      <Container className="relative z-10">
        <div className="max-w-3xl">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-block px-4 py-2 rounded-full bg-primary/20 text-primary-light text-sm font-bold tracking-wider uppercase mb-6"
          >
            Premium Properties for Sale
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-6xl font-extrabold font-heading leading-tight mb-6"
          >
            Invest in Your <br />
            <span className="text-primary">Dream Property</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-gray-400 leading-relaxed mb-10 max-w-2xl"
          >
            Discover handpicked luxury residences and commercial spaces designed for discerning investors. 
            Every listing is verified, every location is prime.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-wrap gap-4 mb-12"
          >
            <Link href="#buy-listings">
              <Button size="lg" className="gap-2 group">
                Browse Properties
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link href="/contact">
              <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white hover:text-dark">
                Talk to a Consultant
              </Button>
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex flex-wrap gap-6"
          >
            {highlights.map((item) => (
              <div key={item.label} className="flex items-center gap-3 bg-white/5 border border-white/10 px-5 py-3 rounded-xl">
                <item.icon className="w-5 h-5 text-primary-light" />
                <span className="text-sm font-bold tracking-wide">{item.label}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </Container>
    </section>
  );
}
