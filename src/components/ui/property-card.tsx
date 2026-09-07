import Link from "next/link";
import { Bed, Bath, Maximize2, MapPin } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { SmartImage } from "@/components/ui/smart-image";
import { SaveButton } from "@/components/ui/save-button";
import { Property } from "@/types";

interface PropertyCardProps {
  property: Property;
  className?: string;
  /**
   * Rendered above the fold (first row of a grid). Lets the browser fetch the
   * image immediately instead of waiting for the intersection observer.
   */
  priority?: boolean;
}

/**
 * The card is an `<article>`, not one big `<a>`: the save button has to live
 * outside the link (a button inside an anchor is invalid HTML and unreachable
 * by keyboard). The title link is "stretched" over the whole card with an
 * `::after` overlay instead, so the entire card is still clickable while
 * screen readers announce a single, meaningfully named link.
 */
export function PropertyCard({ property, className, priority = false }: PropertyCardProps) {
  const forSale = property.type === "sale";
  const alt = `${property.name} — ${property.beds} bedroom ${
    forSale ? "property for sale" : "property to rent"
  } in ${property.location}`;

  return (
    <article
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white transition-all duration-300 hover:shadow-xl",
        "has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-offset-2 has-[a:focus-visible]:outline-primary",
        className
      )}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
        <div className="absolute left-4 top-4 z-10">
          <Badge variant={forSale ? "primary" : "secondary"}>
            For {forSale ? "Sale" : "Rent"}
          </Badge>
        </div>
        <SaveButton
          propertyId={property.id}
          propertyName={property.name}
          className="absolute right-3 top-3 z-20"
        />
        <div
          className="absolute inset-0 z-[5] bg-primary-dark/10 transition-colors group-hover:bg-primary-dark/0"
          aria-hidden="true"
        />
        {property.image ? (
          <SmartImage
            src={property.image}
            alt={alt}
            fill
            priority={priority}
            // One column on phones, two on tablets, three from `lg` up.
            sizes="(min-width: 1280px) 384px, (min-width: 1024px) 30vw, (min-width: 640px) 45vw, 92vw"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary-light/20 to-primary-dark/20 text-primary-dark">
            <Maximize2 className="h-12 w-12" aria-hidden="true" />
            <span className="sr-only">No photo available for {property.name}</span>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-4 p-6">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-1 text-lg font-bold text-dark transition-colors group-hover:text-primary sm:text-xl">
            <Link
              href={`/properties/${property.slug}`}
              className="after:absolute after:inset-0 after:z-10 after:content-[''] focus-visible:outline-none"
            >
              {property.name}
            </Link>
          </h3>
          <p className="shrink-0 text-base font-bold text-primary sm:text-lg">
            {formatCurrency(property.price, property.currency)}
            {!forSale && <span className="text-sm font-semibold text-gray-600">/mo</span>}
          </p>
        </div>

        <p className="flex items-center gap-2 text-sm text-gray-600">
          <MapPin className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
          {property.location}
        </p>

        <ul className="grid grid-cols-3 gap-2 border-t border-gray-100 pt-4 sm:gap-4">
          <li className="flex items-center gap-1.5 text-sm text-gray-700 sm:gap-2">
            <Bed className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
            {property.beds} Beds
          </li>
          <li className="flex items-center gap-1.5 text-sm text-gray-700 sm:gap-2">
            <Bath className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
            {property.baths} Baths
          </li>
          <li className="flex items-center gap-1.5 text-sm text-gray-700 sm:gap-2">
            <Maximize2 className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
            {property.sqft} sqft
          </li>
        </ul>
      </div>
    </article>
  );
}
