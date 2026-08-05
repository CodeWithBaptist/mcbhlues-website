"use client";

import { Bed, Bath, Maximize2, CheckCircle2 } from "lucide-react";
import { Property } from "@/types";

interface PropertyContentProps {
  property: Property;
}

const features = [
  "Smart Home System",
  "Private Pool",
  "Ocean View",
  "Fitness Center",
  "24/7 Security",
  "Parking Space",
  "High-speed Internet",
  "Garden Area",
];

export function PropertyContent({ property }: PropertyContentProps) {
  return (
    <div className="flex flex-col gap-12">
      {/* Specs bar */}
      <div className="grid grid-cols-3 gap-6 py-6 border-y border-gray-100">
        <div className="flex flex-col items-center gap-1">
          <Bed className="w-6 h-6 text-primary" />
          <span className="text-xl font-bold text-dark">{property.beds}</span>
          <span className="text-xs text-gray-400 uppercase font-bold tracking-widest">Bedrooms</span>
        </div>
        <div className="flex flex-col items-center gap-1 border-x border-gray-100 px-6">
          <Bath className="w-6 h-6 text-primary" />
          <span className="text-xl font-bold text-dark">{property.baths}</span>
          <span className="text-xs text-gray-400 uppercase font-bold tracking-widest">Bathrooms</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <Maximize2 className="w-6 h-6 text-primary" />
          <span className="text-xl font-bold text-dark">{property.sqft}</span>
          <span className="text-xs text-gray-400 uppercase font-bold tracking-widest">Sq Ft</span>
        </div>
      </div>

      {/* Description */}
      <div>
        <h3 className="text-2xl font-bold text-dark font-heading mb-6">Property Description</h3>
        <p className="text-gray-600 leading-relaxed text-lg">
          This stunning property offers an unparalleled living experience. Nestled in the heart of {property.location}, 
          every detail has been meticulously crafted to provide comfort and luxury. From the expansive living spaces 
          to the high-end finishes, this residence is designed for the discerning individual.
          <br /><br />
          Experience breathtaking views and world-class amenities in this architectural masterpiece. 
          Perfectly positioned for convenience and privacy, it represents the pinnacle of modern luxury real estate.
        </p>
      </div>

      {/* Features */}
      <div>
        <h3 className="text-2xl font-bold text-dark font-heading mb-6">Key Features</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          {features.map((feature) => (
            <div key={feature} className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-primary" />
              <span className="text-gray-700">{feature}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
