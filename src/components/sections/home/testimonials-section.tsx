"use client";

import { motion } from "framer-motion";
import { Quote, Star } from "lucide-react";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { cn } from "@/lib/utils";

export interface PublicTestimonial {
  id: string;
  name: string;
  role: string;
  quote: string;
  avatarUrl: string;
  rating: number;
}

/**
 * Homepage testimonials, fed from the Staff Portal (Content → Testimonials).
 * The section hides itself entirely when nothing is published.
 */
export function TestimonialsSection({ testimonials }: { testimonials: PublicTestimonial[] }) {
  if (testimonials.length === 0) return null;

  return (
    <section className="py-24 bg-gray-50/60">
      <Container>
        <SectionHeading
          eyebrow="Client Voices"
          title="What Our Clients Say"
          description="Trusted by homeowners, investors and businesses across the market."
        />
        <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {testimonials.slice(0, 6).map((item, index) => (
            <motion.figure
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.08 }}
              className="flex flex-col rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"
            >
              <Quote className="mb-4 h-6 w-6 text-primary/40" />
              <blockquote className="flex-1 text-sm leading-relaxed text-gray-600">
                “{item.quote}”
              </blockquote>
              <div className="mt-4 flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, star) => (
                  <Star
                    key={star}
                    className={cn(
                      "h-4 w-4",
                      star < item.rating ? "fill-amber-400 text-amber-400" : "text-gray-200"
                    )}
                  />
                ))}
              </div>
              <figcaption className="mt-4 flex items-center gap-3 border-t border-gray-50 pt-4">
                {item.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.avatarUrl} alt={item.name} className="h-10 w-10 rounded-full object-cover" />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                    {item.name
                      .split(" ")
                      .map((part) => part[0])
                      .slice(0, 2)
                      .join("")}
                  </div>
                )}
                <div>
                  <p className="text-sm font-bold text-dark">{item.name}</p>
                  <p className="text-xs text-gray-400">{item.role || "Client"}</p>
                </div>
              </figcaption>
            </motion.figure>
          ))}
        </div>
      </Container>
    </section>
  );
}
