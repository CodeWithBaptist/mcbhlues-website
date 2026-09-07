"use client";

import { motion } from "framer-motion";
import { Key, ShieldCheck, Clock } from "lucide-react";
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

/**
 * Rent page hero. The photo comes from the CMS (Content → Website CMS) via
 * props; the default applies when no override has been saved.
 */
export function RentHero({ content }: { content?: RentHeroContent }) {
  const image = content?.image || DEFAULT_HERO_IMAGE;
  const imageAlt = content?.imageAlt || DEFAULT_HERO_IMAGE_ALT;

  return (
    <section className="relative overflow-hidden bg-primary-soft py-16 sm:py-20 md:py-32">
      {/* Decorative background */}
      <div className="absolute top-0 right-0 w-1/3 h-full bg-primary/5 -skew-x-12 translate-x-1/4" />
      <div className="absolute top-20 left-10 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />

      <Container className="relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <span className="mb-6 inline-block border border-primary/30 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-primary-dark sm:text-sm">
              Residential and commercial rentals
            </span>
            <h1 className="text-4xl md:text-6xl font-extrabold font-heading text-dark leading-tight mb-6">
              Rent homes and <br />
              <span className="text-primary">workspace</span>
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
                  className: "w-full px-8 font-bold sm:w-auto",
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

            <div className="mt-12 flex flex-wrap gap-x-8 gap-y-4">
               <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-primary" aria-hidden="true" />
                  <span className="text-sm font-bold text-dark">Vetted Listings</span>
               </div>
               <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" aria-hidden="true" />
                  <span className="text-sm font-bold text-dark">Flexible Terms</span>
               </div>
               <div className="flex items-center gap-2">
                  <Key className="w-5 h-5 text-primary" aria-hidden="true" />
                  <span className="text-sm font-bold text-dark">Instant Viewing</span>
               </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="hidden lg:block relative"
          >
            <div className="aspect-[4/3] overflow-hidden rounded-[2rem] border-8 border-white bg-white shadow-2xl">
              <div className="relative h-full w-full">
                <SmartImage
                  src={image}
                  alt={imageAlt}
                  fill
                  sizes="(min-width: 1024px) 45vw, 1px"
                  className="object-cover"
                />
              </div>
            </div>
          </motion.div>
        </div>
      </Container>
    </section>
  );
}
