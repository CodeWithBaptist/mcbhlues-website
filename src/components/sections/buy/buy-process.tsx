"use client";

import { motion } from "framer-motion";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";

const steps = [
  {
    step: "01",
    title: "Brief",
    description:
      "Tell us what you are looking for, where and at what budget. We put the brief in writing and agree it with you before any search begins.",
  },
  {
    step: "02",
    title: "Shortlist",
    description:
      "We check title, location and price against recent sales, then send a shortlist for you to approve before viewings are arranged.",
  },
  {
    step: "03",
    title: "Viewings and offer",
    description:
      "Private viewings at times that suit you. When you find the right property we advise on the offer and handle the negotiation.",
  },
  {
    step: "04",
    title: "Completion",
    description:
      "Our legal team reviews the purchase agreement before you sign, and your consultant stays on the case through to handover.",
  },
];

export function BuyProcess() {
  return (
    <section className="bg-background-soft py-20 sm:py-24">
      <Container>
        <SectionHeading
          eyebrow="How it works"
          title="Buying with us, step by step"
          description="The same four stages on every purchase, each one agreed with you before the next begins."
        />

        <ol className="grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => (
            <motion.li
              key={step.step}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ delay: index * 0.06 }}
              className="border-t-2 border-primary/20 pt-6"
            >
              <span className="font-heading text-sm font-semibold tabular-nums text-primary">
                Step {step.step}
              </span>
              <h3 className="mb-3 mt-2 font-heading text-xl font-bold text-dark">{step.title}</h3>
              <p className="text-sm leading-relaxed text-gray-600">{step.description}</p>
            </motion.li>
          ))}
        </ol>
      </Container>
    </section>
  );
}
