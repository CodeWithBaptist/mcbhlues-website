"use client";

import { motion } from "framer-motion";
import { Quote, Star } from "lucide-react";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { SmartImage } from "@/components/ui/smart-image";
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
    <section className="bg-gray-50/60 py-20 sm:py-24">
      <Container>
        <SectionHeading
          eyebrow="Client feedback"
          title="What our clients say"
          description="In their own words, from people we have bought, built or managed property for."
        />
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {testimonials.slice(0, 6).map((item, index) => (
            <motion.figure
              key={item.id}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ delay: index * 0.06 }}
              className="flex flex-col rounded-xl border border-gray-200 bg-white p-6"
            >
              <Quote className="mb-4 h-6 w-6 text-primary/40" aria-hidden="true" />
              <blockquote className="flex-1 text-sm leading-relaxed text-gray-700">
                “{item.quote}”
              </blockquote>
              <div
                className="mt-4 flex items-center gap-0.5"
                role="img"
                aria-label={`Rated ${item.rating} out of 5`}
              >
                {Array.from({ length: 5 }).map((_, star) => (
                  <Star
                    key={star}
                    aria-hidden="true"
                    className={cn(
                      "h-4 w-4",
                      star < item.rating ? "fill-amber-500 text-amber-500" : "text-gray-300"
                    )}
                  />
                ))}
              </div>
              <figcaption className="mt-4 flex items-center gap-3 border-t border-gray-50 pt-4">
                {item.avatarUrl ? (
                  <SmartImage
                    src={item.avatarUrl}
                    alt={`Photo of ${item.name}`}
                    width={40}
                    height={40}
                    sizes="40px"
                    className="h-10 w-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                    {item.name
                      .split(" ")
                      .map((part) => part[0])
                      .slice(0, 2)
                      .join("")}
                  </div>
                )}
                <div>
                  <p className="text-sm font-semibold text-dark">{item.name}</p>
                  <p className="text-xs text-gray-600">{item.role || "Client"}</p>
                </div>
              </figcaption>
            </motion.figure>
          ))}
        </div>
      </Container>
    </section>
  );
}
