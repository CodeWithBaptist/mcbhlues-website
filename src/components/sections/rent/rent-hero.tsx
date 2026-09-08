"use client";

import { motion } from "framer-motion";
import { FileCheck2, ShieldCheck, CalendarCheck } from "lucide-react";
import { Container } from "@/components/ui/container";
import { SmartImage } from "@/components/ui/smart-image";
import { buttonClasses } from "@/components/ui/button";
import Link from "next/link";
import { PRIMARY_CTA } from "@/constants";

export interface RentHeroContent {
  image?: string;
  imageAlt?: string;
}

const DEFAULT_HERO_IMAGE =
  "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1400&q=80";
const DEFAULT_HERO_IMAGE_ALT =
  "Bright, furnished living room in a serviced apartment available to rent through MCBHLUES Enterprises";

const highlights = [
  { icon: ShieldCheck, label: "Every listing checked" },
  { icon: FileCheck2, label: "Leases reviewed before signing" },
  { icon: CalendarCheck, label: "Viewings arranged for you" },
];

/**
 * Rent page hero. The photo comes from the CMS (Content → Website CMS) via
 * props; the default applies when no override has been saved.
 */
export function RentHero({ content }: { content?: RentHeroContent }) {
  const image = content?.image || DEFAULT_HERO_IMAGE;
  const imageAlt = content?.imageAlt || DEFAULT_HERO_IMAGE_ALT;

  return (
    <section className="bg-primary-soft py-16 sm:py-20 md:py-28">
      <Container>
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <span className="mb-6 inline-block border border-gray-300 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-primary-dark sm:text-sm">
              Residential and commercial rentals
            </span>
            <h1 className="mb-6 font-heading text-4xl font-bold leading-[1.1] tracking-tight text-dark md:text-5xl lg:text-6xl">
              Rent homes and workspace
            </h1>
            <p className="mb-10 max-w-xl text-base leading-relaxed text-gray-700 sm:text-lg">
              Search residential and commercial spaces, check the monthly rent and
              the terms, and arrange a viewing. Every lease is reviewed by our
              team before you sign.
            </p>
            <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
              <Link
                href={PRIMARY_CTA.href}
                className={buttonClasses({
                  size: "lg",
                  className: "w-full px-8 font-semibold sm:w-auto",
                })}
              >
                {PRIMARY_CTA.label}
              </Link>
              <Link
                href="#rent-listings"
                className="text-base font-semibold text-primary underline-offset-4 hover:underline"
              >
                or jump to the rentals
              </Link>
            </div>

            <ul className="mt-12 flex flex-wrap gap-x-8 gap-y-3">
              {highlights.map((item) => (
                <li key={item.label} className="flex items-center gap-2 text-sm font-medium text-dark">
                  <item.icon className="h-5 w-5 text-primary" aria-hidden="true" />
                  {item.label}
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="relative hidden lg:block"
          >
            <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-white">
              <SmartImage
                src={image}
                alt={imageAlt}
                fill
                sizes="(min-width: 1024px) 45vw, 1px"
                className="object-cover"
              />
            </div>
          </motion.div>
        </div>
      </Container>
    </section>
  );
}
