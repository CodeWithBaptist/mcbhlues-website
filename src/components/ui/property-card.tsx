import Link from "next/link";
import { Bed, Bath, Maximize2, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Property } from "@/types";

interface PropertyCardProps {
  property: Property;
  className?: string;
}

export function PropertyCard({ property, className }: PropertyCardProps) {
  return (
    <Link
      href={`/properties/${property.id}`}
      className={cn(
        "group flex flex-col bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-xl transition-all duration-300",
        className
      )}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
        <div className="absolute top-4 left-4 z-10">
          <Badge variant={property.type === "sale" ? "primary" : "secondary"}>
            For {property.type === "sale" ? "Sale" : "Rent"}
          </Badge>
        </div>
        <div className="absolute inset-0 bg-primary-dark/10 group-hover:bg-primary-dark/0 transition-colors" />
        {/* Image placeholder since we don't have real images yet */}
        <div className="w-full h-full bg-gradient-to-br from-primary-light/20 to-primary-dark/20 flex items-center justify-center text-primary-dark/50">
          <Maximize2 className="w-12 h-12" />
        </div>
      </div>
      
      <div className="p-6 flex flex-col gap-4">
        <div className="flex justify-between items-start">
          <h3 className="text-xl font-bold text-dark group-hover:text-primary transition-colors line-clamp-1">
            {property.title}
          </h3>
          <p className="text-lg font-bold text-primary shrink-0 ml-2">
            ${property.price.toLocaleString()}
            {property.type === "rent" && <span className="text-sm text-gray-500">/mo</span>}
          </p>
        </div>
        
        <div className="flex items-center gap-2 text-gray-500 text-sm">
          <MapPin className="w-4 h-4 text-primary" />
          {property.location}
        </div>

        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-100">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Bed className="w-4 h-4 text-primary" />
            {property.beds} Beds
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Bath className="w-4 h-4 text-primary" />
            {property.baths} Baths
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Maximize2 className="w-4 h-4 text-primary" />
            {property.sqft} sqft
          </div>
        </div>
      </div>
    </Link>
  );
}
