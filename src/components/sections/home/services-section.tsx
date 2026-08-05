"use client";

import { motion } from "framer-motion";
import { Briefcase, Building2, ShieldCheck, ArrowUpRight } from "lucide-react";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { SERVICES } from "@/constants";
import Link from "next/link";

const iconMap: Record<string, any> = {
  Briefcase,
  Building2,
  ShieldCheck,
};

export function ServicesSection() {
  return (
    <section className="py-24 bg-background-soft">
      <Container>
        <SectionHeading
          eyebrow="What We Do"
          title="Our Premium Services"
          description="Excellence in every square foot. We provide comprehensive solutions across the entire real estate lifecycle."
        />

        <div className="grid md:grid-cols-3 gap-8">
          {SERVICES.map((service, index) => {
            const Icon = iconMap[service.icon];
            return (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="group p-8 bg-white rounded-2xl border border-gray-100 hover:border-primary/20 hover:shadow-xl transition-all duration-300"
              >
                <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-6 group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                  {Icon && <Icon className="w-8 h-8" />}
                </div>
                <h3 className="text-2xl font-bold text-dark mb-4 font-heading group-hover:text-primary transition-colors">
                  {service.title}
                </h3>
                <p className="text-gray-600 leading-relaxed mb-8">
                  {service.description}
                </p>
                <Link
                  href="/about"
                  className="inline-flex items-center gap-2 text-sm font-bold text-primary uppercase tracking-wider group-hover:gap-4 transition-all"
                >
                  Learn More
                  <ArrowUpRight className="w-4 h-4" />
                </Link>
              </motion.div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
