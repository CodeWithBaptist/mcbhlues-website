"use client";

import { motion } from "framer-motion";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";

const steps = [
  {
    step: "01",
    title: "Choose and view",
    description:
      "Pick the rentals that fit your needs and budget from the list below. We arrange viewings at times that suit you.",
  },
  {
    step: "02",
    title: "Apply",
    description:
      "Tell your consultant you would like to proceed. We confirm the terms, rent and deposit in writing and collect the documents the landlord needs.",
  },
  {
    step: "03",
    title: "Review the lease",
    description:
      "Our legal team reviews the tenancy agreement and walks you through it before you sign anything.",
  },
  {
    step: "04",
    title: "Move in",
    description:
      "Sign, pay the agreed amounts and collect your keys. Where we manage the building, the same team looks after it once you are in.",
  },
];

export function RentProcess() {
  return (
    <section className="py-20 sm:py-24">
      <Container>
        <SectionHeading
          eyebrow="How it works"
          title="Renting with us, step by step"
          description="From first viewing to move-in, with the paperwork explained along the way."
        />

        <ol className="mx-auto grid max-w-4xl gap-x-12 gap-y-10 sm:grid-cols-2">
          {steps.map((step, index) => (
            <motion.li
              key={step.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ delay: index * 0.06 }}
              className="flex gap-6"
            >
              <span className="shrink-0 font-heading text-sm font-semibold tabular-nums text-primary">
                {step.step}
              </span>
              <div>
                <h3 className="mb-2 font-heading text-xl font-bold text-dark">{step.title}</h3>
                <p className="text-sm leading-relaxed text-gray-600">{step.description}</p>
              </div>
            </motion.li>
          ))}
        </ol>
      </Container>
    </section>
  );
}
