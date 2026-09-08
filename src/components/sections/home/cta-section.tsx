"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { buttonClasses } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { PRIMARY_CTA } from "@/constants";

/**
 * The closing call to action, repeated at the foot of every marketing page.
 *
 * Exactly one button. The alternative route (browsing listings) is a text link
 * so it reads as a fallback rather than a competing choice — a second
 * equally-weighted button measurably splits clicks.
 */
export function CTASection() {
  return (
    <section className="py-16 sm:py-24">
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          className="rounded-xl bg-primary p-8 text-center text-white sm:p-12 md:p-16"
        >
          <div className="mx-auto max-w-3xl">
            <h2 className="mb-6 font-heading text-2xl font-bold leading-tight tracking-tight sm:text-3xl md:text-4xl">
              Not sure where to start?
            </h2>
            <p className="mx-auto mb-10 max-w-2xl text-base leading-relaxed text-white sm:text-lg">
              Tell us what you want to do and we will reply with a plain
              explanation of the options, the process and the cost. No
              obligation, and no charge for the first conversation.
            </p>

            <div className="flex flex-col items-center gap-5">
              <Link
                href={PRIMARY_CTA.href}
                className={buttonClasses({
                  size: "lg",
                  // `keep-light`: the panel behind this button is brand blue
                  // in both themes, so the button opts out of the dark remaps
                  // (see globals.css) instead of turning dark-on-blue.
                  className:
                    "keep-light w-full gap-2 bg-white px-10 font-semibold text-primary-dark hover:bg-gray-100 focus-visible:outline-white sm:w-auto",
                })}
              >
                {PRIMARY_CTA.label}
                <ArrowRight className="h-5 w-5" aria-hidden="true" />
              </Link>
              <Link
                href="/properties"
                className="text-sm font-semibold text-white underline underline-offset-4 hover:text-white/80"
              >
                or browse current listings
              </Link>
            </div>
          </div>
        </motion.div>
      </Container>
    </section>
  );
}
