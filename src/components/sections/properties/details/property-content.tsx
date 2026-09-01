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
      <div className="grid grid-cols-3 gap-6 border-y border-gray-100 py-6">
        <div className="flex flex-col items-center gap-1">
          <Bed className="h-6 w-6 text-primary" />
          <span className="text-xl font-bold text-dark">{property.beds}</span>
          <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Bedrooms</span>
        </div>
        <div className="flex flex-col items-center gap-1 border-x border-gray-100 px-6">
          <Bath className="h-6 w-6 text-primary" />
          <span className="text-xl font-bold text-dark">{property.baths}</span>
          <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Bathrooms</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <Maximize2 className="h-6 w-6 text-primary" />
          <span className="text-xl font-bold text-dark">{property.sqft}</span>
          <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Sq Ft</span>
        </div>
      </div>

      {/* Description */}
      <div>
        <h3 className="mb-6 font-heading text-2xl font-bold text-dark">Property Description</h3>
        <p className="text-lg leading-relaxed text-gray-600">
          {property.description || `This stunning property offers an unparalleled living experience, nestled in the heart of ${property.location}.`}
        </p>
      </div>

      {/* Features */}
      {features.length > 0 && (
        <div>
          <h3 className="mb-6 font-heading text-2xl font-bold text-dark">Key Features</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            {features.map((feature) => (
              <div key={feature} className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-primary" />
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
              <div key={amenity} className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                <span className="text-gray-700">{amenity}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
