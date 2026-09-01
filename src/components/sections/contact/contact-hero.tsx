"use client";

import { motion } from "framer-motion";
import { Container } from "@/components/ui/container";

export function ContactHero() {
  return (
    <section className="bg-dark py-20 text-white relative overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(#2563EB_1px,transparent_1px)] [background-size:40px_40px]" />
      </div>
      
      <Container className="relative z-10 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <span className="text-primary-light font-bold tracking-widest uppercase text-sm mb-4 block">
            Get In Touch
          </span>
          <h1 className="text-4xl md:text-6xl font-extrabold font-heading mb-6">
            Let&rsquo;s Start a Conversation
          </h1>
          <p className="max-w-2xl mx-auto text-gray-400 text-lg leading-relaxed">
            Whether you&rsquo;re looking to buy, rent, list a property, or need expert consulting, 
            our team is here to provide world-class service.
          </p>
        </motion.div>
      </Container>
    </section>
  );
}
