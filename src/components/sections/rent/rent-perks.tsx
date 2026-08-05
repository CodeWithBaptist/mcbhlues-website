"use client";

import { motion } from "framer-motion";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { Settings, Headphones, ShieldCheck, Zap } from "lucide-react";

const perks = [
  {
    title: "Elite Management",
    description: "24/7 facility management ensures your home is always in peak condition.",
    icon: Settings,
  },
  {
    title: "Concierge Services",
    description: "Dedicated support for all your needs, from maintenance to local recommendations.",
    icon: Headphones,
  },
  {
    title: "Secure Living",
    description: "Advanced security protocols and high-tech systems for your peace of mind.",
    icon: ShieldCheck,
  },
  {
    title: "Prime Connectivity",
    description: "All our rental units are located in high-connectivity zones with modern amenities.",
    icon: Zap,
  },
];

export function RentPerks() {
  return (
    <section className="py-24">
      <Container>
        <SectionHeading
          eyebrow="The Renting Advantage"
          title="Why Rent with MCBHLUES?"
          description="We provide more than just a space; we provide a curated living experience with unparalleled support."
        />

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {perks.map((perk, index) => (
            <motion.div
              key={perk.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="group p-8 rounded-2xl border border-gray-100 bg-white hover:border-primary/20 hover:shadow-xl transition-all duration-300"
            >
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-6 group-hover:bg-primary group-hover:text-white transition-all">
                <perk.icon className="w-7 h-7" />
              </div>
              <h4 className="text-xl font-bold font-heading mb-3 text-dark">{perk.title}</h4>
              <p className="text-gray-500 text-sm leading-relaxed">{perk.description}</p>
            </motion.div>
          ))}
        </div>
      </Container>
    </section>
  );
}
