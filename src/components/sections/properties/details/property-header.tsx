"use client";

import { MapPin, Share2, Heart, Printer } from "lucide-react";
import Link from "next/link";
import { Container } from "@/components/ui/container";
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
              {property.title}
            </h1>
            <div className="flex items-center gap-2 text-gray-500">
              <MapPin className="w-5 h-5 text-primary" />
              <span className="text-lg">{property.location}</span>
            </div>
          </div>

          <div className="flex flex-col items-start md:items-end gap-4">
            <p className="text-3xl md:text-4xl font-black text-primary font-heading">
              ${property.price.toLocaleString()}
              {property.type === "rent" && <span className="text-xl font-bold text-gray-400">/mo</span>}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="w-10 h-10 p-0 rounded-full">
                <Share2 className="w-4 h-4" />
              </Button>
              <Link href="/favorites">
              <Button variant="outline" size="sm" className="w-10 h-10 p-0 rounded-full">
                <Heart className="w-4 h-4" />
              </Button>
            </Link>
              <Button variant="outline" size="sm" className="w-10 h-10 p-0 rounded-full">
                <Printer className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
