"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";

export interface HeroContent {
  badge: string;
  title: string;
  subtitle: string;
}

/**
 * Homepage hero. Copy comes from the CMS (Content → Website CMS) via props;
 * the defaults are applied by the page when no override has been saved.
 */
export function Hero({ content }: { content?: HeroContent }) {
  const badge = content?.badge || "Property consulting, development and management";
  const title = content?.title || "We help you buy, build and manage property";
  const subtitle =
    content?.subtitle ||
    "MCBHLUES ENTERPRISES advises buyers and investors, develops residential and commercial buildings, and runs day to day facility management. One team and one point of contact from the first viewing through to handover and beyond.";

  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden bg-background-soft">
      <Container className="relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <span className="inline-block px-4 py-2 border border-primary/20 text-primary text-sm font-semibold tracking-wide uppercase mb-6">
              {badge}
            </span>
            <h1 className="text-5xl md:text-6xl font-extrabold text-dark leading-[1.08] mb-6 font-heading">
              {title}
            </h1>
            <p className="text-lg text-gray-600 leading-relaxed mb-10 max-w-xl font-body">
              {subtitle}
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/properties">
                <Button size="lg" className="gap-2 group">
                  Explore Properties
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="/about">
                <Button size="lg" variant="outline">
                  How we work
                </Button>
              </Link>
            </div>

            <p className="mt-12 text-sm text-gray-500 leading-relaxed max-w-md">
              Give us a call or send a message. A consultant who knows your case
              stays on it for the whole transaction. No call centres and no hand
              offs between departments.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.15 }}
            className="relative hidden lg:block"
          >
            <div className="relative rounded-2xl overflow-hidden shadow-2xl">
              {/* eslint-disable-next-line @next/next/no-img-element -- editorial imagery placeholder */}
              <img
                src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1400&q=80"
                alt="Modern residential building managed by MCBHLUES Enterprises"
                className="aspect-[4/5] w-full object-cover"
              />
            </div>
          </motion.div>
        </div>
      </Container>
    </section>
  );
}
