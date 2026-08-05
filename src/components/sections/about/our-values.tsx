"use client";

import { motion } from "framer-motion";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { Shield, Sparkles, Zap, Globe } from "lucide-react";

const values = [
  {
    title: "Uncompromising Quality",
    description: "We set the gold standard in every project, ensuring every detail reflects our commitment to excellence.",
    icon: Shield,
  },
  {
    title: "Innovative Solutions",
    description: "Embracing the latest technologies and sustainable practices to build properties for the next generation.",
    icon: Zap,
  },
  {
    title: "Client-Centricity",
    description: "Your vision is our blueprint. We work tirelessly to bring your luxury living dreams to life.",
    icon: Sparkles,
  },
  {
    title: "Global Vision",
    description: "While we have local expertise, we operate with a global perspective to deliver world-class results.",
    icon: Globe,
  },
];

export function OurValues() {
  return (
    <section className="py-24 bg-background-soft">
      <Container>
        <SectionHeading
          eyebrow="Core Principles"
          title="What Defines Us"
          description="At MCBHLUES ENTERPRISES, we are driven by a set of core values that ensure we remain at the pinnacle of the real estate industry."
        />

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {values.map((value, index) => (
            <motion.div
              key={value.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="bg-white p-8 rounded-2xl border border-gray-100 hover:shadow-lg transition-all"
            >
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-6">
                <value.icon className="w-7 h-7" />
              </div>
              <h4 className="text-xl font-bold font-heading mb-4 text-dark">{value.title}</h4>
              <p className="text-gray-600 text-sm leading-relaxed">{value.description}</p>
            </motion.div>
          ))}
        </div>
      </Container>
    </section>
  );
}
