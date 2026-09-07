"use client";

import { MapPin } from "lucide-react";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Property } from "@/types";
import { buttonClasses } from "@/components/ui/button";
import { SaveButton } from "@/components/ui/save-button";

interface PropertyHeaderProps {
  property: Property;
}

export function PropertyHeader({ property }: PropertyHeaderProps) {
  return (
    <section className="py-8 bg-white border-b border-gray-100">
      <Container>
        <div className="site-stagger flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div className="mb-4 flex gap-2">
              <Badge variant={property.type === "sale" ? "primary" : "secondary"}>
                For {property.type === "sale" ? "Sale" : "Rent"}
              </Badge>
              <Badge variant="light" className="capitalize">
                {property.status}
              </Badge>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-dark font-heading mb-2">
              {property.name}
            </h1>
            {property.title && (
              <p className="text-xl md:text-2xl text-gray-600 font-medium mb-2">
                {property.title}
              </p>
            )}
            <div className="flex items-center gap-2 text-gray-600">
              <MapPin className="w-5 h-5 text-primary" aria-hidden="true" />
              <span className="text-lg">{property.location}</span>
            </div>
          </div>

          <div className="flex flex-col items-start md:items-end gap-4">
            <p className="font-heading text-3xl font-black tabular-nums text-primary md:text-4xl">
              {formatCurrency(property.price, property.currency)}
              {property.type === "rent" && <span className="text-xl font-bold text-gray-500">/mo</span>}
            </p>
            <div className="flex items-center gap-3">
              {/* Utility control, deliberately quieter than the single primary CTA. */}
              <SaveButton
                propertyId={property.id}
                propertyName={property.name}
                className="border border-gray-200 shadow-none"
              />
              <Link
                href="#inquiry"
                className={buttonClasses({ size: "lg" })}
              >
                Arrange a viewing
              </Link>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
