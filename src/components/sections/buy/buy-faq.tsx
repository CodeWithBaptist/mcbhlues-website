"use client";

import { useId, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus } from "lucide-react";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { cn } from "@/lib/utils";

/**
 * Built-in answers describe only what the rest of the site already commits
 * to (written briefs, checks before listing, private viewings, legal review).
 * Anything more specific — timelines, financing partners — belongs in the
 * CMS where staff can keep it accurate.
 */
const defaultFaqs = [
  {
    question: "What kinds of property do you sell?",
    answer:
      "Residential and commercial property across Lagos — houses, apartments, land and commercial space. Every listing is checked before it goes live, and the current stock is on the Properties page.",
  },
  {
    question: "How does a purchase start?",
    answer:
      "With a conversation. Tell us what you are looking for and at what budget; we put a written brief together with you, then search and shortlist against it before any viewings are arranged.",
  },
  {
    question: "How do you check a listing before it goes live?",
    answer:
      "Title and location are checked and the asking price is compared with recent sales in the area. If something does not stand up, the property is not listed.",
  },
  {
    question: "Can I view a property before making a decision?",
    answer:
      "Yes. Private viewings are arranged at a time that suits you, and your consultant attends so questions can be answered on the spot.",
  },
  {
    question: "Who reviews the paperwork?",
    answer:
      "Purchase agreements are reviewed by our own legal team before you sign, and your consultant stays on the case through to handover.",
  },
];

export interface FaqItem {
  question: string;
  answer: string;
}

/**
 * FAQ accordion. Items come from the Staff Portal CMS (Content → FAQs);
 * the built-in list renders when the CMS has no published entries yet.
 */
export function BuyFAQ({ items }: { items?: FaqItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const baseId = useId();
  const faqs = items && items.length > 0 ? items : defaultFaqs;

  const toggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="py-20 sm:py-24">
      <Container>
        <SectionHeading
          eyebrow="Common questions"
          title="Buying through MCBHLUES Enterprises"
          description="Short answers to the questions we are asked most often. Anything else, ask your consultant."
        />

        <div className="mx-auto max-w-3xl border-t border-gray-200">
          {faqs.map((faq, index) => {
            const open = openIndex === index;
            const panelId = `${baseId}-panel-${index}`;
            const buttonId = `${baseId}-button-${index}`;
            return (
              <div key={index} className="border-b border-gray-200">
                <h3>
                  <button
                    id={buttonId}
                    type="button"
                    onClick={() => toggle(index)}
                    aria-expanded={open}
                    aria-controls={panelId}
                    className="group flex w-full items-center justify-between gap-6 py-5 text-left"
                  >
                    <span className="font-heading text-base font-semibold text-dark transition-colors duration-200 group-hover:text-primary sm:text-lg">
                      {faq.question}
                    </span>
                    <Plus
                      className={cn(
                        "h-5 w-5 shrink-0 text-gray-500 transition-transform duration-250 ease-soft",
                        open && "rotate-45 text-primary"
                      )}
                      aria-hidden="true"
                    />
                  </button>
                </h3>
                <AnimatePresence initial={false}>
                  {open && (
                    <motion.div
                      id={panelId}
                      role="region"
                      aria-labelledby={buttonId}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden"
                    >
                      <p className="pb-6 leading-relaxed text-gray-600">{faq.answer}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
