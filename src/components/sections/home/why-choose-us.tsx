"use client";

import { motion } from "framer-motion";
import { FileCheck2, Handshake, ScrollText, UserCheck } from "lucide-react";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";

const features = [
  {
    title: "One accountable team",
    description: "The consultants, developers and managers you meet are the people who handle your project. You are not passed between departments.",
    icon: UserCheck,
  },
  {
    title: "Costs agreed up front",
    description: "Budgets, fees and timelines are set out in writing before work starts, and payments are released against agreed milestones.",
    icon: ScrollText,
  },
  {
    title: "Advice that is not sales",
    description: "When we advise you on what to buy, the recommendation follows the brief you set, not whatever we happen to have on our books.",
    icon: Handshake,
  },
  {
    title: "Contracts we can defend",
    description: "Purchase, tenancy and management agreements are reviewed by our own legal team before you sign anything.",
    icon: FileCheck2,
  },
];

const expectations = [
  "A written brief and a shortlist you approve before any viewing.",
  "Scheduled progress updates and a named contact who answers when you call.",
  "An inspection and formal sign off at handover, with defects followed up.",
  "One clear monthly statement covering management fees and property spend.",
];

export function WhyChooseUs() {
  return (
    <section className="bg-white py-20 sm:py-24">
      <Container>
        <div className="grid items-start gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <SectionHeading
              align="left"
              eyebrow="How we operate"
              title="What you can expect when you work with us"
              description="We keep the working relationship straightforward: clear scope, agreed costs and one team that sees the job through."
            />

            <div className="mt-2 grid gap-8 sm:grid-cols-2">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-80px" }}
                  transition={{ delay: index * 0.06 }}
                  className="flex flex-col gap-3"
                >
                  <feature.icon className="h-6 w-6 text-primary" aria-hidden="true" />
                  <div>
                    <h3 className="mb-2 font-heading text-lg font-bold text-dark">{feature.title}</h3>
                    <p className="text-sm leading-relaxed text-gray-600">{feature.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            className="lg:mt-16"
          >
            <div className="rounded-xl border border-gray-200 bg-background-soft p-8 md:p-10">
              <h3 className="mb-6 font-heading text-xl font-bold text-dark">How a typical project runs</h3>
              <ol className="space-y-5">
                {expectations.map((item, index) => (
                  <li key={item} className="flex gap-4 text-[15px] leading-relaxed text-gray-600">
                    <span className="mt-0.5 shrink-0 font-heading text-sm font-semibold tabular-nums text-primary">
                      0{index + 1}
                    </span>
                    {item}
                  </li>
                ))}
              </ol>
              <p className="mt-8 border-t border-gray-200 pt-6 text-sm leading-relaxed text-gray-600">
                Every scope is put in writing before we begin, so you know what is
                included, what it costs and when it will be done.
              </p>
            </div>
          </motion.div>
        </div>
      </Container>
    </section>
  );
}
