"use client";

import { motion } from "framer-motion";
import { ArrowRight, MousePointer2 } from "lucide-react";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";

export interface HeroContent {
  badge: string;
  title: string;
  subtitle: string;
}

/**
 * Homepage hero. Copy comes from the CMS (Content → Website CMS) via props;
 * the defaults are applied by the page when no override has been saved.
 * The word "Luxury" is highlighted when present.
 */
export function Hero({ content }: { content?: HeroContent }) {
  const badge = content?.badge || "Welcome to MCBHLUES ENTERPRISES";
  const title = content?.title || "Redefining Luxury & Innovation in Real Estate";
  const subtitle =
    content?.subtitle ||
    "Specializing in high-end consulting, avant-garde property development, and elite facility management for discerning clients.";

  const highlightIndex = title.indexOf("Luxury");
  const renderedTitle =
    highlightIndex === -1 ? (
      title
    ) : (
      <>
        {title.slice(0, highlightIndex)}
        <span className="text-primary">Luxury</span>
        {title.slice(highlightIndex + "Luxury".length)}
      </>
    );

  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-1/2 h-full bg-primary-soft/30 -z-10 skew-x-12 translate-x-1/4" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-primary/5 rounded-full blur-3xl -z-10" />

      <Container className="relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <span className="inline-block px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-bold tracking-wider uppercase mb-6">
              {badge}
            </span>
            <h1 className="text-5xl md:text-7xl font-extrabold text-dark leading-[1.1] mb-6 font-heading">
              {renderedTitle}
            </h1>
            <p className="text-xl text-gray-600 leading-relaxed mb-10 max-w-xl font-body">
              {subtitle}
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/properties">
                <Button size="lg" className="gap-2 group">
                  Explore Properties
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="/about">
                <Button size="lg" variant="outline">
                  Our Services
                </Button>
              </Link>
            </div>
            
            <div className="mt-12 flex items-center gap-8">
              <div>
                <p className="text-3xl font-extrabold text-dark">500+</p>
                <p className="text-sm text-gray-500 uppercase tracking-wider">Properties Managed</p>
              </div>
              <div className="w-px h-10 bg-gray-200" />
              <div>
                <p className="text-3xl font-extrabold text-dark">$2B+</p>
                <p className="text-sm text-gray-500 uppercase tracking-wider">Asset Value</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative hidden lg:block"
          >
            <div className="relative z-10 rounded-3xl overflow-hidden shadow-2xl border-8 border-white">
              <div className="aspect-[4/5] bg-gradient-to-br from-primary-light to-primary-dark flex items-center justify-center">
                 <div className="text-white text-center p-8">
                    <MousePointer2 className="w-20 h-20 mx-auto mb-6 opacity-50" />
                    <p className="text-2xl font-bold font-heading">Luxury Living Defined</p>
                 </div>
              </div>
            </div>
            {/* Decorative Card */}
            <div className="absolute -bottom-10 -right-10 z-20 bg-white p-6 rounded-2xl shadow-xl max-w-[240px] border border-gray-100 animate-bounce-slow">
              <p className="text-sm font-bold text-primary mb-2 italic">&ldquo;Exceptional Service&rdquo;</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-200" />
                <div>
                  <p className="text-xs font-bold text-dark">James Wilson</p>
                  <p className="text-[10px] text-gray-400">CEO, TechGlobal</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </Container>
    </section>
  );
}
