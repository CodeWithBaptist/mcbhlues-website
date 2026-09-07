"use client";

import { motion } from "framer-motion";
import { ArrowRight, ShieldCheck, TrendingUp, Award } from "lucide-react";
import { Container } from "@/components/ui/container";
import { buttonClasses } from "@/components/ui/button";
import Link from "next/link";
import { PRIMARY_CTA } from "@/constants";

const highlights = [
  { icon: ShieldCheck, label: "Title and location checked" },
  { icon: TrendingUp, label: "Priced against recent sales" },
  { icon: Award, label: "Private viewings arranged" },
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
            Homes and commercial space for sale
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-6xl font-extrabold font-heading leading-tight mb-6"
          >
            Property for sale, <br />
            <span className="text-primary">with guidance on the way</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-gray-300 leading-relaxed mb-10 max-w-2xl"
          >
            Search listings below and filter by price. Each one has been checked
            before it goes live, and our consultants can arrange a private viewing
            or talk you through the purchase process.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-12 flex flex-col items-start gap-5 sm:flex-row sm:items-center"
          >
            {/* One primary action. The in-page jump is demoted to a text link
                so there is never a second thing competing for the click. */}
            <Link
              href={PRIMARY_CTA.href}
              className={buttonClasses({
                size: "lg",
                className: "group w-full gap-2 font-bold sm:w-auto",
              })}
            >
              {PRIMARY_CTA.label}
              <ArrowRight
                className="h-5 w-5 transition-transform group-hover:translate-x-1"
                aria-hidden="true"
              />
            </Link>
            <Link
              href="#buy-listings"
              className="text-base font-semibold text-white underline-offset-4 hover:underline"
            >
              or jump to the listings
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
