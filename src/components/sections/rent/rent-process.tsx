"use client";

import { motion } from "framer-motion";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { ClipboardCheck, Calendar, FileText, CheckCircle2 } from "lucide-react";

const steps = [
  {
    icon: ClipboardCheck,
    title: "Apply Online",
    description: "Submit your application and required documents through our secure portal.",
  },
  {
    icon: FileText,
    title: "Vetting & Approval",
    description: "Our team reviews your application and conducts necessary background checks.",
  },
  {
    icon: Calendar,
    title: "Schedule Viewing",
    description: "Once pre-approved, schedule a private tour of your selected properties.",
  },
  {
    icon: CheckCircle2,
    title: "Move In",
    description: "Sign the agreement, collect your keys, and enjoy your new luxury home.",
  },
];

export function RentProcess() {
  return (
    <section className="py-24">
      <Container>
        <SectionHeading
          eyebrow="Smooth Transitions"
          title="How to Rent with Us"
          description="We've streamlined our rental process to be as fast and transparent as possible."
        />

        <div className="max-w-4xl mx-auto">
           <div className="grid sm:grid-cols-2 gap-12">
              {steps.map((step, index) => (
                 <motion.div
                    key={step.title}
                    initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    className="flex gap-6 items-start"
                 >
                    <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center text-white shrink-0 shadow-lg shadow-primary/20">
                       <step.icon className="w-8 h-8" />
                    </div>
                    <div>
                       <h4 className="text-xl font-bold font-heading mb-2 text-dark">{step.title}</h4>
                       <p className="text-gray-600 leading-relaxed text-sm">{step.description}</p>
                    </div>
                 </motion.div>
              ))}
           </div>
        </div>
      </Container>
    </section>
  );
}
