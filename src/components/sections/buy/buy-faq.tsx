"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Minus } from "lucide-react";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { cn } from "@/lib/utils";

const faqs = [
  {
    question: "What types of properties does MCBHLUES offer for sale?",
    answer:
      "We offer a comprehensive range of luxury properties including penthouses, villas, estates, lofts, and premium commercial spaces. Each listing is hand-verified to meet our rigorous quality and location standards.",
  },
  {
    question: "Do you provide financing assistance for property purchases?",
    answer:
      "Yes. We work with a network of trusted financial institutions and mortgage brokers to help you secure the best financing options. Our consultants will guide you through the entire process.",
  },
  {
    question: "How do you verify your property listings?",
    answer:
      "Every listing undergoes a thorough verification process that includes title checks, physical inspections, neighborhood assessments, and legal clearance. This ensures you invest with complete confidence.",
  },
  {
    question: "Can I schedule property viewings before making a decision?",
    answer:
      "Absolutely. We encourage all prospective buyers to schedule private viewings. Our agents will arrange exclusive tours at your convenience, including virtual walkthroughs for international buyers.",
  },
  {
    question: "What is the average transaction timeline?",
    answer:
      "Typically, the process from initial consultation to closing takes 30 to 60 days, depending on the property type and financing arrangement. We work to expedite every step while maintaining thorough due diligence.",
  },
];

export function BuyFAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="py-24">
      <Container>
        <SectionHeading
          eyebrow="Questions Answered"
          title="Frequently Asked Questions"
          description="Everything you need to know about buying a luxury property through MCBHLUES ENTERPRISES."
        />

        <div className="max-w-3xl mx-auto">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
              className={cn(
                "border-b border-gray-100 last:border-b-0",
              )}
            >
              <button
                onClick={() => toggle(index)}
                className="w-full flex items-center justify-between py-6 text-left group"
              >
                <span className="text-lg font-bold text-dark font-heading group-hover:text-primary transition-colors pr-8">
                  {faq.question}
                </span>
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors",
                    openIndex === index
                      ? "bg-primary text-white"
                      : "bg-gray-100 text-dark group-hover:bg-primary/10"
                  )}
                >
                  {openIndex === index ? (
                    <Minus className="w-4 h-4" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                </div>
              </button>
              <AnimatePresence>
                {openIndex === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <p className="pb-6 text-gray-600 leading-relaxed">
                      {faq.answer}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </Container>
    </section>
  );
}
