"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { buttonClasses } from "@/components/ui/button";
import { SmartImage } from "@/components/ui/smart-image";
import { PRIMARY_CTA } from "@/constants";

export interface HeroContent {
  badge: string;
  title: string;
  subtitle: string;
  image?: string;
  imageAlt?: string;
}

const DEFAULT_HERO_IMAGE =
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1400&q=80";
const DEFAULT_HERO_IMAGE_ALT =
  "Contemporary apartment block in Lagos developed and managed by MCBHLUES Enterprises, seen from the street at dusk";

/**
 * Homepage hero. Copy and photo come from the CMS (Content → Website CMS) via
 * props; the defaults below apply when no override has been saved.
 */
export function Hero({ content }: { content?: HeroContent }) {
  const badge = content?.badge || "Property consulting, development and management";
  const title = content?.title || "We help you buy, build and manage property";
  const subtitle =
    content?.subtitle ||
    "MCBHLUES Enterprises advises buyers and investors, develops residential and commercial buildings, and runs day to day facility management. One team and one point of contact from the first viewing through to handover and beyond.";
  const image = content?.image || DEFAULT_HERO_IMAGE;
  const imageAlt = content?.imageAlt || DEFAULT_HERO_IMAGE_ALT;

  return (
    <section className="relative flex items-center overflow-hidden bg-background-soft py-16 sm:py-20 lg:min-h-[88vh] lg:py-0">
      <Container className="relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <span className="mb-6 inline-block border border-gray-300 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-primary-dark sm:text-sm">
              {badge}
            </span>
            <h1 className="mb-6 font-heading text-4xl font-bold leading-[1.1] tracking-tight text-dark sm:text-5xl md:text-6xl">
              {title}
            </h1>
            <p className="mb-10 max-w-xl font-body text-base leading-relaxed text-gray-700 sm:text-lg">
              {subtitle}
            </p>
            {/* One primary action. Everything else on the page is a text link
                so there is never a second thing competing for the click. */}
            <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
              <Link
                href={PRIMARY_CTA.href}
                className={buttonClasses({
                  size: "lg",
                  className: "group w-full gap-2 font-bold sm:w-auto",
                })}
              >
                {PRIMARY_CTA.label}
                <ArrowRight
                  className="h-5 w-5 transition-transform group-hover:translate-x-1"
                  aria-hidden="true"
                />
              </Link>
              <Link
                href="/properties"
                className="text-base font-semibold text-primary underline-offset-4 hover:underline"
              >
                or browse the listings
              </Link>
            </div>

            <p className="mt-10 max-w-md text-sm leading-relaxed text-gray-600">
              Give us a call or send a message. A consultant who knows your case
              stays on it for the whole transaction. No call centres and no hand
              offs between departments.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="relative hidden lg:block"
          >
            <div className="relative overflow-hidden rounded-xl">
              <SmartImage
                src={image}
                alt={imageAlt}
                width={1120}
                height={1400}
                sizes="(min-width: 1024px) 45vw, 1px"
                className="aspect-[4/5] w-full object-cover"
              />
            </div>
          </motion.div>
        </div>
      </Container>
    </section>
  );
}
