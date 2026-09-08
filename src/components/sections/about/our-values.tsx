"use client";

import { motion } from "framer-motion";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { FileCheck2, Handshake, ScrollText, UserCheck } from "lucide-react";

/**
 * The same four commitments the homepage makes ("What you can expect"),
 * stated here as the principles behind them — so the two pages never
 * describe the firm in different words.
 */
const values = [
  {
    title: "One accountable team",
    description:
      "The consultants, developers and managers you meet are the people who handle your project. You are not passed between departments.",
    icon: UserCheck,
  },
  {
    title: "Costs agreed up front",
    description:
      "Budgets, fees and timelines are set out in writing before work starts, and payments are released against agreed milestones.",
    icon: ScrollText,
  },
  {
    title: "Advice, not sales",
    description:
      "When we advise you on what to buy, the recommendation follows the brief you set, not whatever we happen to have on our books.",
    icon: Handshake,
  },
  {
    title: "Contracts we can defend",
    description:
      "Purchase, tenancy and management agreements are reviewed by our own legal team before you sign anything.",
    icon: FileCheck2,
  },
];

export function OurValues() {
  return (
    <section className="bg-background-soft py-20 sm:py-24">
      <Container>
        <SectionHeading
          eyebrow="How we work"
          title="The principles behind every engagement"
          description="Four commitments we make on every project, whatever its size."
        />

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          {values.map((value, index) => (
            <motion.div
              key={value.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ delay: index * 0.06 }}
              className="rounded-xl border border-gray-200 bg-white p-7"
            >
              <value.icon className="mb-5 h-6 w-6 text-primary" aria-hidden="true" />
              <h3 className="mb-3 font-heading text-lg font-bold text-dark">{value.title}</h3>
              <p className="text-sm leading-relaxed text-gray-600">{value.description}</p>
            </motion.div>
          ))}
        </div>
      </Container>
    </section>
  );
}
