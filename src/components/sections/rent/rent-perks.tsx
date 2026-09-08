"use client";

import { motion } from "framer-motion";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { FileCheck2, ShieldCheck, Wrench, UserCheck } from "lucide-react";

/**
 * What renting through the firm actually includes — each point maps to a
 * service the company already describes elsewhere on the site.
 */
const perks = [
  {
    title: "Listings we have checked",
    description:
      "Every rental is inspected and its ownership confirmed before it is advertised, so what you view is what you rent.",
    icon: ShieldCheck,
  },
  {
    title: "Leases reviewed for you",
    description:
      "Tenancy agreements go through our legal team before you sign. Terms, deposits and notice periods are explained in plain language.",
    icon: FileCheck2,
  },
  {
    title: "Managed buildings",
    description:
      "Where we manage the property, maintenance, cleaning and security are run by our facility team with one number to call.",
    icon: Wrench,
  },
  {
    title: "One point of contact",
    description:
      "The consultant who shows you the property is the one who handles your application, move-in and any questions afterwards.",
    icon: UserCheck,
  },
];

export function RentPerks() {
  return (
    <section className="py-20 sm:py-24">
      <Container>
        <SectionHeading
          eyebrow="Renting with us"
          title="What is included when you rent through MCBHLUES"
          description="Straightforward tenancies, with the checks and the support handled by the same team."
        />

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          {perks.map((perk, index) => (
            <motion.div
              key={perk.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ delay: index * 0.06 }}
              className="rounded-xl border border-gray-200 bg-white p-7"
            >
              <perk.icon className="mb-5 h-6 w-6 text-primary" aria-hidden="true" />
              <h3 className="mb-3 font-heading text-lg font-bold text-dark">{perk.title}</h3>
              <p className="text-sm leading-relaxed text-gray-600">{perk.description}</p>
            </motion.div>
          ))}
        </div>
      </Container>
    </section>
  );
}
