"use client";

import { MapPin } from "lucide-react";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Property } from "@/types";
import { Button } from "@/components/ui/button";

interface PropertyHeaderProps {
  property: Property;
}

export function PropertyHeader({ property }: PropertyHeaderProps) {
  return (
    <section className="py-8 bg-white border-b border-gray-100">
      <Container>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div className="flex gap-2 mb-4">
              <Badge variant={property.type === "sale" ? "primary" : "secondary"}>
                For {property.type === "sale" ? "Sale" : "Rent"}
              </Badge>
              <Badge variant="light">{property.status}</Badge>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-dark font-heading mb-2">
              {property.name}
            </h1>
            {property.title && (
              <p className="text-xl md:text-2xl text-gray-600 font-medium mb-2">
                {property.title}
              </p>
            )}
            <div className="flex items-center gap-2 text-gray-500">
              <MapPin className="w-5 h-5 text-primary" />
              <span className="text-lg">{property.location}</span>
            </div>
          </div>

          <div className="flex flex-col items-start md:items-end gap-4">
            <p className="text-3xl md:text-4xl font-black text-primary font-heading">
              {formatCurrency(property.price, property.currency)}
              {property.type === "rent" && <span className="text-xl font-bold text-gray-400">/mo</span>}
            </p>
            <Link href="#inquiry">
              <Button size="lg">Arrange a viewing</Button>
            </Link>
          </div>
        </div>
      </Container>
    </section>
  );
}
