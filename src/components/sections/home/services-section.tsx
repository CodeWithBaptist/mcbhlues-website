"use client";

import { motion } from "framer-motion";
import { Briefcase, Building2, ShieldCheck, ArrowRight } from "lucide-react";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { SERVICES } from "@/constants";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";

const iconMap: Record<string, LucideIcon> = {
  Briefcase,
  Building2,
  ShieldCheck,
};

export function ServicesSection() {
  return (
    <section className="bg-background-soft py-20 sm:py-24">
      <Container>
        <SectionHeading
          eyebrow="What We Do"
          title="Three services, one team"
          description="Consulting, development and facility management, handled by the same people from the first conversation to the last inspection."
        />

        <div className="grid gap-6 md:grid-cols-3 lg:gap-8">
          {SERVICES.map((service, index) => {
            const Icon = iconMap[service.icon];
            return (
              <motion.article
                key={service.id}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ delay: index * 0.08 }}
                className="group flex flex-col rounded-xl border border-gray-200 bg-white p-7 transition-[border-color,box-shadow] duration-250 ease-soft hover:border-gray-300 hover:shadow-soft sm:p-8"
              >
                {Icon && <Icon className="mb-6 h-6 w-6 text-primary" aria-hidden="true" />}
                <h3 className="mb-3 font-heading text-xl font-bold text-dark">
                  {service.title}
                </h3>
                <p className="mb-8 text-sm leading-relaxed text-gray-600 sm:text-base">
                  {service.description}
                </p>
                <Link
                  href="/about"
                  className="mt-auto inline-flex items-center gap-2 text-sm font-semibold text-primary underline-offset-4 hover:underline"
                >
                  How we work
                  <ArrowRight
                    className="h-4 w-4 transition-transform duration-200 ease-soft group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                </Link>
              </motion.article>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
