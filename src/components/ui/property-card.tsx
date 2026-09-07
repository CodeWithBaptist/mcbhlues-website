import Link from "next/link";
import { Bed, Bath, Maximize2, MapPin, Star, Images, ArrowRight } from "lucide-react";
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
        "group relative flex h-full flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-soft",
        "transition-[transform,box-shadow,border-color] duration-300 ease-soft",
        "hover:-translate-y-1.5 hover:border-primary/30 hover:shadow-lift",
        "focus-within:border-primary/40 focus-within:shadow-lift",
        "has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-offset-2 has-[a:focus-visible]:outline-primary",
        className
      )}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
        <div className="absolute left-4 top-4 z-10 flex flex-wrap items-center gap-2">
          <Badge
            variant={forSale ? "primary" : "secondary"}
            className="backdrop-blur-sm transition-transform duration-300 ease-soft group-hover:scale-[1.04]"
          >
            For {forSale ? "Sale" : "Rent"}
          </Badge>
          {property.isFeatured && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/95 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-amber-950 shadow-sm backdrop-blur-sm">
              <Star className="h-3 w-3 fill-current" aria-hidden="true" />
              Featured
            </span>
          )}
        </div>

        <SaveButton
          propertyId={property.id}
          propertyName={property.name}
          className="absolute right-3 top-3 z-20"
        />

        {/* Bottom scrim: quiet at rest, deepens on hover so the chips stay legible. */}
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 z-[5] h-1/2 bg-gradient-to-t from-black/55 via-black/10 to-transparent opacity-70 transition-opacity duration-300 group-hover:opacity-100"
          aria-hidden="true"
        />

        {photoCount > 1 && (
          <span
            className="absolute bottom-3 right-3 z-[6] inline-flex items-center gap-1.5 rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-sm"
            aria-hidden="true"
          >
            <Images className="h-3.5 w-3.5" />
            {photoCount}
          </span>
        )}

        {status && (
          <span
            className={cn(
              "absolute bottom-3 left-4 z-[6] rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide shadow-sm",
              status.className
            )}
          >
            {status.label}
          </span>
        )}

        {/* Hover-only cue that the whole card is a link. Pointer/focus only —
            touch users already get the card tap target. */}
        <span
          className="pointer-events-none absolute inset-x-0 bottom-12 z-[6] hidden translate-y-2 justify-center opacity-0 transition-all duration-300 ease-soft group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100 md:flex"
          aria-hidden="true"
        >
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3.5 py-1.5 text-xs font-bold text-primary-dark shadow-md">
            View details
            <ArrowRight className="h-3.5 w-3.5" />
          </span>
        </span>

        {property.image ? (
          <SmartImage
            src={property.image}
            alt={alt}
            fill
            priority={priority}
            // One column on phones, two on tablets, three from `lg` up.
            sizes="(min-width: 1280px) 384px, (min-width: 1024px) 30vw, (min-width: 640px) 45vw, 92vw"
            className="h-full w-full object-cover transition-transform duration-700 ease-soft group-hover:scale-[1.07]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary-light/20 to-primary-dark/20 text-primary-dark transition-colors duration-300 group-hover:from-primary-light/30 group-hover:to-primary-dark/25">
            <Maximize2 className="h-12 w-12" aria-hidden="true" />
            <span className="sr-only">No photo available for {property.name}</span>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-4 p-6">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-1 text-lg font-bold text-dark transition-colors duration-200 group-hover:text-primary sm:text-xl">
            <Link
              href={`/properties/${property.slug}`}
              className="after:absolute after:inset-0 after:z-10 after:content-[''] focus-visible:outline-none"
            >
              {property.name}
            </Link>
          </h3>
          <p className="shrink-0 text-right text-base font-bold tabular-nums text-primary sm:text-lg">
            {formatCurrency(property.price, property.currency)}
            {!forSale && <span className="text-sm font-semibold text-gray-600">/mo</span>}
          </p>
        </div>

        <p className="flex items-center gap-2 text-sm text-gray-600">
          <MapPin className="h-4 w-4 shrink-0 text-primary transition-transform duration-300 group-hover:scale-110" aria-hidden="true" />
          <span className="line-clamp-1">{property.location}</span>
        </p>

        <ul className="mt-auto grid grid-cols-3 gap-2 border-t border-gray-100 pt-4 transition-colors duration-300 group-hover:border-primary/15 sm:gap-4">
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
            {property.sqm} sqm
          </li>
        </ul>
      </div>
    </article>
  );
}
