"use client";

import { motion } from "framer-motion";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { Linkedin, Twitter, User } from "lucide-react";

const team = [
  {
    name: "Marcus Blue",
    role: "Founder & CEO",
    bio: "Visionary leader with 20+ years of experience in luxury property development.",
  },
  {
    name: "Elena Rodriguez",
    role: "Head of Consulting",
    bio: "Expert analyst specializing in high-yield real estate investment strategies.",
  },
  {
    name: "David Chen",
    role: "Director of Facilities",
    bio: "Passionate about operational excellence and high-touch management services.",
  },
  {
    name: "Sarah Jenkins",
    role: "Lead Architect",
    bio: "Award-winning architect focused on sustainable luxury and modern aesthetics.",
  },
];

export function TeamSection() {
  return (
    <section className="py-24">
      <Container>
        <SectionHeading
          eyebrow="Our Leadership"
          title="The Minds Behind MCBHLUES"
          description="Meet our dedicated team of industry experts committed to delivering exceptional results for every client."
        />

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {team.map((member, index) => (
            <motion.div
              key={member.name}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="group"
            >
              <div className="aspect-square rounded-3xl bg-gray-100 mb-6 relative overflow-hidden flex items-center justify-center">
                 <User className="w-20 h-20 text-gray-300" />
                 <div className="absolute inset-0 bg-primary/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                    <a href="#" className="w-10 h-10 rounded-full bg-white text-primary flex items-center justify-center hover:bg-primary-dark hover:text-white transition-colors">
                      <Linkedin className="w-5 h-5" />
                    </a>
                    <a href="#" className="w-10 h-10 rounded-full bg-white text-primary flex items-center justify-center hover:bg-primary-dark hover:text-white transition-colors">
                      <Twitter className="w-5 h-5" />
                    </a>
                 </div>
              </div>
              <h4 className="text-xl font-bold font-heading text-dark text-center">{member.name}</h4>
              <p className="text-primary text-sm font-semibold text-center mb-4 uppercase tracking-wider">{member.role}</p>
              <p className="text-gray-600 text-sm text-center leading-relaxed px-4">{member.bio}</p>
            </motion.div>
          ))}
        </div>
      </Container>
    </section>
  );
}
