import Link from "next/link";
import { Bed, Bath, Maximize2, MapPin, Images } from "lucide-react";
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

/** Statuses other than "available" get a chip over the photo. */
const STATUS_CHIP: Record<string, { label: string; className: string }> = {
  pending: { label: "Sale pending", className: "bg-amber-500/95 text-white" },
  sold: { label: "Sold", className: "bg-gray-900/85 text-white" },
  rented: { label: "Let agreed", className: "bg-gray-900/85 text-white" },
};

/**
 * The card is an `<article>`, not one big `<a>`: the save button has to live
 * outside the link (a button inside an anchor is invalid HTML and unreachable
 * by keyboard). The title link is "stretched" over the whole card with an
 * `::after` overlay instead, so the entire card is still clickable while
 * screen readers announce a single, meaningfully named link.
 *
 * Hover is deliberately quiet: a 2px lift, a firmer border, and a slow, slight
 * zoom on the photograph. The photo carries the card; nothing competes with it.
 */
export function PropertyCard({ property, className, priority = false }: PropertyCardProps) {
  const forSale = property.type === "sale";
  const status = STATUS_CHIP[property.status];
  const photoCount = property.images.length;
  const alt = `${property.name} — ${property.beds} bedroom ${
    forSale ? "property for sale" : "property to rent"
  } in ${property.location}`;

  return (
    <article
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-xl border border-gray-200 bg-white",
        "transition-[transform,box-shadow,border-color] duration-300 ease-soft",
        "hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-lift",
        "focus-within:border-gray-300 focus-within:shadow-lift",
        "has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-offset-2 has-[a:focus-visible]:outline-primary",
        className
      )}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
        <div className="absolute left-4 top-4 z-10 flex flex-wrap items-center gap-2">
          <Badge variant={forSale ? "primary" : "secondary"}>
            For {forSale ? "Sale" : "Rent"}
          </Badge>
          {property.isFeatured && (
            <Badge variant="light" className="bg-white/95 text-primary-dark">
              Featured
            </Badge>
          )}
        </div>

        <SaveButton
          propertyId={property.id}
          propertyName={property.name}
          className="absolute right-3 top-3 z-20"
        />

        {/* Bottom scrim keeps the status chip and photo count legible on bright photos. */}
        {(photoCount > 1 || status) && (
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 z-[5] h-1/3 bg-gradient-to-t from-black/45 to-transparent"
            aria-hidden="true"
          />
        )}

        {photoCount > 1 && (
          <span
            className="absolute bottom-3 right-3 z-[6] inline-flex items-center gap-1.5 rounded-md bg-black/55 px-2 py-1 text-[11px] font-semibold text-white"
            aria-hidden="true"
          >
            <Images className="h-3.5 w-3.5" />
            {photoCount}
          </span>
        )}

        {status && (
          <span
            className={cn(
              "absolute bottom-3 left-4 z-[6] rounded-md px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider",
              status.className
            )}
          >
            {status.label}
          </span>
        )}

        {property.image ? (
          <SmartImage
            src={property.image}
            alt={alt}
            fill
            priority={priority}
            // One column on phones, two on tablets, three from `lg` up.
            sizes="(min-width: 1280px) 384px, (min-width: 1024px) 30vw, (min-width: 640px) 45vw, 92vw"
            className="h-full w-full object-cover transition-transform duration-500 ease-soft group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-background-soft text-primary-dark/50">
            <Maximize2 className="h-10 w-10" aria-hidden="true" />
            <span className="sr-only">No photo available for {property.name}</span>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5 sm:p-6">
        <div>
          <p className="text-lg font-bold tabular-nums text-dark sm:text-xl">
            {formatCurrency(property.price, property.currency)}
            {!forSale && <span className="text-sm font-medium text-gray-600"> / month</span>}
          </p>
          <h3 className="mt-1 line-clamp-1 font-heading text-base font-semibold text-dark transition-colors duration-200 group-hover:text-primary">
            <Link
              href={`/properties/${property.slug}`}
              className="after:absolute after:inset-0 after:z-10 after:content-[''] focus-visible:outline-none"
            >
              {property.name}
            </Link>
          </h3>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-gray-600">
            <MapPin className="h-4 w-4 shrink-0 text-gray-400" aria-hidden="true" />
            <span className="line-clamp-1">{property.location}</span>
          </p>
        </div>

        <ul className="mt-auto flex flex-wrap items-center gap-x-5 gap-y-1.5 border-t border-gray-100 pt-4 text-sm text-gray-700">
          <li className="flex items-center gap-1.5">
            <Bed className="h-4 w-4 shrink-0 text-gray-400" aria-hidden="true" />
            {property.beds} <span className="text-gray-500">bed</span>
          </li>
          <li className="flex items-center gap-1.5">
            <Bath className="h-4 w-4 shrink-0 text-gray-400" aria-hidden="true" />
            {property.baths} <span className="text-gray-500">bath</span>
          </li>
          <li className="flex items-center gap-1.5">
            <Maximize2 className="h-4 w-4 shrink-0 text-gray-400" aria-hidden="true" />
            {property.sqm} <span className="text-gray-500">sqm</span>
          </li>
        </ul>
      </div>
    </article>
  );
}
