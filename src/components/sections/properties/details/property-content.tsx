"use client";

import { Bed, Bath, Maximize2, CheckCircle2 } from "lucide-react";
import { Property } from "@/types";

interface PropertyContentProps {
  property: Property;
  amenities?: string[];
  features?: string[];
}

export function PropertyContent({ property, amenities = [], features = [] }: PropertyContentProps) {
  return (
    <div className="flex flex-col gap-12">
      {/* Specs bar */}
      <div className="site-stagger grid grid-cols-3 gap-6 border-y border-gray-100 py-6">
        <div className="flex flex-col items-center gap-1">
          <Bed className="h-6 w-6 text-primary" />
          <span className="text-xl font-bold text-dark">{property.beds}</span>
          <span className="text-xs font-bold uppercase tracking-widest text-gray-500">Bedrooms</span>
        </div>
        <div className="flex flex-col items-center gap-1 border-x border-gray-100 px-6">
          <Bath className="h-6 w-6 text-primary" />
          <span className="text-xl font-bold text-dark">{property.baths}</span>
          <span className="text-xs font-bold uppercase tracking-widest text-gray-500">Bathrooms</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <Maximize2 className="h-6 w-6 text-primary" />
          <span className="text-xl font-bold text-dark">{property.sqm}</span>
          <span className="text-xs font-bold uppercase tracking-widest text-gray-500">Sq M</span>
        </div>
      </div>

      {/* Description */}
      <div>
        <h3 className="mb-6 font-heading text-2xl font-bold text-dark">Property Description</h3>
        <p className="text-lg leading-relaxed text-gray-600">
          {property.description ||
            `${property.name} is located in ${property.location}. Contact us to arrange a viewing or ask for more details.`}
        </p>
      </div>

      {/* Features */}
      {features.length > 0 && (
        <div>
          <h3 className="mb-6 font-heading text-2xl font-bold text-dark">Key Features</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            {features.map((feature) => (
              <div
                key={feature}
                className="group flex items-center gap-3 rounded-lg px-2 py-1.5 transition-colors duration-200 hover:bg-background-soft"
              >
                <CheckCircle2 className="h-5 w-5 shrink-0 text-primary transition-transform duration-300 ease-soft group-hover:scale-110" />
                <span className="text-gray-700">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Amenities */}
      {amenities.length > 0 && (
        <div>
          <h3 className="mb-6 font-heading text-2xl font-bold text-dark">Amenities</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            {amenities.map((amenity) => (
              <div
                key={amenity}
                className="group flex items-center gap-3 rounded-lg px-2 py-1.5 transition-colors duration-200 hover:bg-background-soft"
              >
                <CheckCircle2 className="h-5 w-5 shrink-0 text-primary transition-transform duration-300 ease-soft group-hover:scale-110" />
                <span className="text-gray-700">{amenity}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
