"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { PropertyCard } from "@/components/ui/property-card";
import { Button } from "@/components/ui/button";
import { DUMMY_PROPERTIES } from "@/constants";
import Link from "next/link";

export function FeaturedProperties() {
  const featured = DUMMY_PROPERTIES.slice(0, 3);

  return (
    <section className="py-24">
      <Container>
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <SectionHeading
            align="left"
            eyebrow="Exclusive Listings"
            title="Featured Properties"
            description="Explore our handpicked selection of premium residences and commercial spaces."
            className="mb-0"
          />
          <Link href="/properties">
            <Button variant="outline" className="gap-2">
              View All Properties
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {featured.map((property, index) => (
            <motion.div
              key={property.id}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <PropertyCard property={property} />
            </motion.div>
          ))}
        </div>
      </Container>
    </section>
  );
}
