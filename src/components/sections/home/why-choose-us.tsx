"use client";

import { motion } from "framer-motion";
import { CheckCircle2, FileCheck2, Handshake, ScrollText, UserCheck } from "lucide-react";
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
    <section className="py-24 bg-white">
      <Container>
        <div className="grid lg:grid-cols-2 gap-16 items-start">
          <div>
            <SectionHeading
              align="left"
              eyebrow="How we operate"
              title="What you can expect when you work with us"
              description="We keep the working relationship straightforward: clear scope, agreed costs and one team that sees the job through."
            />

            <div className="grid sm:grid-cols-2 gap-8 mt-12">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.08 }}
                  className="flex flex-col gap-4"
                >
                  <div className="w-12 h-12 rounded-md bg-primary/10 flex items-center justify-center text-primary">
                    <feature.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold font-heading mb-2">{feature.title}</h4>
                    <p className="text-gray-600 text-sm leading-relaxed">{feature.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="lg:mt-16"
          >
            <div className="rounded-2xl border border-gray-200 bg-background-soft p-8 md:p-10">
              <div className="flex items-center gap-3 mb-6">
                <CheckCircle2 className="w-6 h-6 text-primary" />
                <h3 className="text-xl font-bold font-heading">How a typical project runs</h3>
              </div>
              <ul className="space-y-5">
                {expectations.map((item) => (
                  <li key={item} className="flex gap-3 text-gray-600 text-[15px] leading-relaxed">
                    <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                      <CheckCircle2 className="w-4 h-4" />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
              <p className="mt-8 border-t border-gray-200 pt-6 text-sm text-gray-600 leading-relaxed">
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
