"use client";

import { motion } from "framer-motion";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { SERVICES } from "@/constants";

const commitments = [
  {
    title: "Our approach to projects",
    description:
      "Every job starts with a written brief and an agreed budget, then moves through the stages we sign off on together, in writing.",
  },
  {
    title: "How we work",
    description:
      "A named consultant stays on your case, progress is reported at set intervals, and you review and approve before any money moves.",
  },
];

export function OurStory() {
  return (
    <section className="py-20 sm:py-24">
      <Container>
        <div className="grid items-start gap-12 lg:grid-cols-2 lg:gap-16">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
          >
            <SectionHeading
              align="left"
              eyebrow="What we do"
              title="Consulting, development and management under one roof"
              description="Buying, building and running property each need different skills. We keep them in one firm so the handover from one stage to the next does not fall through the cracks."
              className="mb-10"
            />
            <dl className="divide-y divide-gray-200 border-y border-gray-200">
              {commitments.map((item) => (
                <div key={item.title} className="grid gap-2 py-6 sm:grid-cols-3 sm:gap-6">
                  <dt className="font-heading text-base font-bold text-dark">{item.title}</dt>
                  <dd className="text-sm leading-relaxed text-gray-600 sm:col-span-2">{item.description}</dd>
                </div>
              ))}
            </dl>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ delay: 0.08 }}
            className="rounded-xl border border-gray-200 bg-background-soft p-8 sm:p-10"
          >
            <p className="mb-6 text-sm font-semibold uppercase tracking-widest text-primary">
              The three services
            </p>
            <ol className="space-y-6">
              {SERVICES.map((service, index) => (
                <li key={service.id} className="flex gap-5">
                  <span className="font-heading text-sm font-semibold tabular-nums text-gray-500">
                    0{index + 1}
                  </span>
                  <div>
                    <h3 className="font-heading text-lg font-bold text-dark">{service.title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-gray-600">{service.description}</p>
                  </div>
                </li>
              ))}
            </ol>
            <p className="mt-8 border-t border-gray-200 pt-6 text-sm leading-relaxed text-gray-600">
              One team and one point of contact from the first viewing through to
              handover and beyond.
            </p>
          </motion.div>
        </div>
      </Container>
    </section>
  );
}
