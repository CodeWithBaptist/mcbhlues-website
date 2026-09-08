"use client";

import { motion } from "framer-motion";
import { ArrowRight, ShieldCheck, TrendingUp, CalendarCheck } from "lucide-react";
import { Container } from "@/components/ui/container";
import { buttonClasses } from "@/components/ui/button";
import Link from "next/link";
import { PRIMARY_CTA } from "@/constants";

const highlights = [
  { icon: ShieldCheck, label: "Title and location checked" },
  { icon: TrendingUp, label: "Priced against recent sales" },
  { icon: CalendarCheck, label: "Private viewings arranged" },
];

export function BuyHero() {
  return (
    <section className="bg-dark py-20 text-white md:py-28">
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-3xl"
        >
          <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-primary-light">
            Homes and commercial space for sale
          </p>

          <h1 className="mb-6 font-heading text-4xl font-bold leading-[1.1] tracking-tight md:text-5xl lg:text-6xl">
            Property for sale, with guidance on the way
          </h1>

          <p className="mb-10 max-w-2xl text-lg leading-relaxed text-gray-300">
            Search listings below and filter by price. Each one has been checked
            before it goes live, and our consultants can arrange a private viewing
            or talk you through the purchase process.
          </p>

          <div className="mb-12 flex flex-col items-start gap-5 sm:flex-row sm:items-center">
            {/* One primary action. The in-page jump is demoted to a text link
                so there is never a second thing competing for the click. */}
            <Link
              href={PRIMARY_CTA.href}
              className={buttonClasses({
                size: "lg",
                className: "group w-full gap-2 font-semibold sm:w-auto",
              })}
            >
              {PRIMARY_CTA.label}
              <ArrowRight
                className="h-5 w-5 transition-transform duration-200 group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </Link>
            <Link
              href="#buy-listings"
              className="text-base font-semibold text-white underline-offset-4 hover:underline"
            >
              or jump to the listings
            </Link>
          </div>

          <ul className="flex flex-wrap gap-x-8 gap-y-3 border-t border-white/10 pt-8">
            {highlights.map((item) => (
              <li key={item.label} className="flex items-center gap-2.5 text-sm font-medium text-gray-200">
                <item.icon className="h-5 w-5 text-primary-light" aria-hidden="true" />
                {item.label}
              </li>
            ))}
          </ul>
        </motion.div>
      </Container>
    </section>
  );
}
