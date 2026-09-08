"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { PropertyCard } from "@/components/ui/property-card";
import { buttonClasses } from "@/components/ui/button";
import { Property } from "@/types";
import Link from "next/link";

interface FeaturedPropertiesProps {
  properties: Property[];
  /** Heading copy. The defaults suit the homepage; the details page passes its own. */
  eyebrow?: string;
  title?: string;
  description?: string;
  /** Listing to leave out (the one currently being viewed). */
  excludeId?: string;
}

export function FeaturedProperties({
  properties,
  eyebrow = "Current listings",
  title = "Featured properties",
  description = "A selection from what is on the market with us right now.",
  excludeId,
}: FeaturedPropertiesProps) {
  const pool = excludeId ? properties.filter((p) => p.id !== excludeId) : properties;
  const featured = (pool.some((p) => p.isFeatured) ? pool.filter((p) => p.isFeatured) : pool).slice(0, 3);

  if (featured.length === 0) return null;

  return (
    <section className="py-20 sm:py-24">
      <Container>
        <div className="mb-10 flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <SectionHeading
            align="left"
            eyebrow={eyebrow}
            title={title}
            description={description}
            className="mb-0"
          />
          <Link
            href="/properties"
            className={buttonClasses({ variant: "outline", className: "shrink-0 gap-2" })}
          >
            View all properties
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>

        <div className="grid gap-6 md:grid-cols-3 lg:gap-8">
          {featured.map((property, index) => (
            <motion.div
              key={property.id}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ delay: index * 0.08 }}
            >
              <PropertyCard property={property} />
            </motion.div>
          ))}
        </div>
      </Container>
    </section>
  );
}
