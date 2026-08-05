"use client";

import { motion } from "framer-motion";
import { Search, FileText, Handshake, Key } from "lucide-react";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";

const steps = [
  {
    step: "01",
    icon: Search,
    title: "Discover",
    description: "Browse our curated portfolio of verified luxury properties. Use our advanced filters to find the perfect match.",
  },
  {
    step: "02",
    icon: FileText,
    title: "Consult",
    description: "Schedule a free consultation with our expert agents. We provide market insights and personalized recommendations.",
  },
  {
    step: "03",
    icon: Handshake,
    title: "Negotiate",
    description: "We handle all negotiations to ensure you get the best value. Our team works tirelessly on your behalf.",
  },
  {
    step: "04",
    icon: Key,
    title: "Close",
    description: "Seamlessly close your deal with our legal and financial support. From paperwork to handover, we manage it all.",
  },
];

export function BuyProcess() {
  return (
    <section className="py-24 bg-background-soft">
      <Container>
        <SectionHeading
          eyebrow="How It Works"
          title="Your Path to Ownership"
          description="We've simplified the luxury property buying process into four straightforward steps."
        />

        <div className="grid md:grid-cols-4 gap-8 relative">
          {/* Connector Line */}
          <div className="hidden md:block absolute top-20 left-[12.5%] right-[12.5%] h-0.5 bg-primary/20 -z-0" />

          {steps.map((step, index) => (
            <motion.div
              key={step.step}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.15 }}
              className="relative flex flex-col items-center text-center group"
            >
              <div className="relative z-10 w-20 h-20 rounded-2xl bg-white border-2 border-primary/10 flex items-center justify-center mb-6 group-hover:border-primary group-hover:shadow-lg group-hover:shadow-primary/10 transition-all duration-300">
                <step.icon className="w-8 h-8 text-primary group-hover:scale-110 transition-transform" />
              </div>
              <span className="text-primary font-black text-sm tracking-widest mb-2">
                STEP {step.step}
              </span>
              <h3 className="text-xl font-bold text-dark font-heading mb-3">{step.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed max-w-[240px]">{step.description}</p>
            </motion.div>
          ))}
        </div>
      </Container>
    </section>
  );
}
