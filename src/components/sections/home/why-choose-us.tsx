"use client";

import { motion } from "framer-motion";
import { CheckCircle2, Award, Users2, Rocket } from "lucide-react";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";

const features = [
  {
    title: "Market Leadership",
    description: "Decades of experience in the luxury real estate sector with a proven track record.",
    icon: Award,
  },
  {
    title: "Expert Team",
    description: "Highly skilled professionals dedicated to excellence in consulting and management.",
    icon: Users2,
  },
  {
    title: "Innovative Approach",
    description: "Utilizing modern technology and sustainable practices in property development.",
    icon: Rocket,
  },
  {
    title: "Unmatched Standards",
    description: "We don't just meet expectations; we redefine them through meticulous attention to detail.",
    icon: CheckCircle2,
  },
];

export function WhyChooseUs() {
  return (
    <section className="py-24 bg-dark text-white overflow-hidden relative">
      {/* Background patterns */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
         <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(#2563EB_1px,transparent_1px)] [background-size:40px_40px]" />
      </div>

      <Container className="relative z-10">
        <div className="grid lg:grid-cols-2 gap-20 items-center">
          <div>
            <SectionHeading
              align="left"
              eyebrow="Our Value Proposition"
              title="Why Choose MCBHLUES ENTERPRISES?"
              description="We combine local expertise with global standards to deliver exceptional value in every project we undertake."
              className="text-white"
            />
            
            <div className="grid sm:grid-cols-2 gap-8 mt-12">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="flex flex-col gap-4"
                >
                  <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center text-primary">
                    <feature.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold font-heading mb-2">{feature.title}</h4>
                    <p className="text-gray-400 text-sm leading-relaxed">{feature.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="aspect-square bg-gradient-to-tr from-primary-dark to-primary rounded-3xl relative overflow-hidden group">
               <div className="absolute inset-0 flex items-center justify-center opacity-20 group-hover:scale-110 transition-transform duration-700">
                  <Award className="w-64 h-64 text-white" />
               </div>
               <div className="absolute bottom-8 left-8 right-8 bg-white/10 backdrop-blur-md p-8 rounded-2xl border border-white/10">
                  <p className="text-4xl font-black mb-2">25+</p>
                  <p className="text-sm uppercase tracking-widest font-bold text-primary-light">Years of Industry Excellence</p>
               </div>
            </div>
          </motion.div>
        </div>
      </Container>
    </section>
  );
}
