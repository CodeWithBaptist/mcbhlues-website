"use client";

import { motion } from "framer-motion";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { Building2, Target, Heart } from "lucide-react";

export function OurStory() {
  return (
    <section className="py-24">
      <Container>
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <SectionHeading
              align="left"
              eyebrow="What we do"
              title="Consulting, development and management under one roof"
              description="Buying, building and running property each need different skills. We keep them in one firm so the handover from one stage to the next does not fall through the cracks."
              className="mb-8"
            />
            <div className="space-y-6">
              <div className="flex gap-4 p-4 rounded-xl border border-gray-100 hover:border-primary/20 transition-colors">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <Target className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-dark mb-1">Our approach to projects</h4>
                  <p className="text-gray-600 text-sm">Every job starts with a written brief and an agreed budget, then moves through the stages we sign off on together, in writing.</p>
                </div>
              </div>
              <div className="flex gap-4 p-4 rounded-xl border border-gray-100 hover:border-primary/20 transition-colors">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <Heart className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-dark mb-1">How we work</h4>
                  <p className="text-gray-600 text-sm">A named consultant stays on your case, progress is reported at set intervals, and you review and approve before any money moves.</p>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative"
          >
            <div className="aspect-video rounded-3xl bg-primary-soft overflow-hidden relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-primary-dark/40 to-transparent z-10" />
              <div className="absolute inset-0 flex items-center justify-center z-20">
                <Building2 className="w-24 h-24 text-white opacity-50 group-hover:scale-110 transition-transform duration-500" />
              </div>
            </div>
            <div className="absolute -bottom-6 -right-6 bg-white p-6 rounded-2xl shadow-xl border border-gray-100 hidden md:block z-30 max-w-[240px]">
              <p className="text-primary font-black text-4xl mb-1">One team</p>
              <p className="text-gray-600 text-xs font-bold uppercase tracking-tight">
                From first viewing through handover and beyond
              </p>
            </div>
          </motion.div>
        </div>
      </Container>
    </section>
  );
}
