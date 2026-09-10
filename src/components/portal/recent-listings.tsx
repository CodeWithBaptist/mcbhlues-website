import Link from "next/link";
import { MapPin } from "lucide-react";
import { Card, StatusPill } from "@/components/portal/ui";
import { PropertyThumbnail } from "@/components/portal/property-thumbnail";

export type RecentListingItem = {
  id: string;
  name: string;
  /** "Ikeja, Lagos" style line; empty string when no address is set. */
  location: string;
  status: string;
  imageUrl: string | null;
  imageAlt: string;
};

/**
 * The reference mockup's "Property Listings" card: a compact photo, the
 * listing name and where it is, and the same status pill the properties
 * manager uses. Reuses `PropertyThumbnail` so broken or missing photos get
 * the same honest fallback as the rest of the portal.
 */
export function RecentListings({
  items,
  href = "/portal/properties",
  className,
}: {
  items: RecentListingItem[];
  href?: string;
  className?: string;
}) {
  return (
    <Card
      className={className}
      title="Recent listings"
      description="Latest properties added to the portfolio"
      actions={
        <Link
          href={href}
          className="text-sm font-medium text-primary underline-offset-4 transition-colors hover:text-primary-dark hover:underline"
        >
          View all
        </Link>
      }
    >
      {items.length === 0 ? (
        <p className="py-8 text-center text-sm text-gray-500">
          No listings yet — your newest properties will show here.
        </p>
      ) : (
        <ul className="divide-y divide-gray-100">
          {items.map((item) => (
            <li key={item.id}>
              <Link
                href={href}
                className="group -mx-2 flex items-center gap-3 rounded-md px-2 py-3 transition-colors duration-200 hover:bg-gray-50"
              >
                <span className="h-14 w-[76px] shrink-0 overflow-hidden rounded-md bg-gray-100">
                  <PropertyThumbnail src={item.imageUrl ?? undefined} alt={item.imageAlt} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-dark transition-colors group-hover:text-primary">
                    {item.name}
                  </span>
                  {item.location && (
                    <span className="mt-0.5 flex items-center gap-1 truncate text-xs text-gray-500">
                      <MapPin className="h-3 w-3 shrink-0" aria-hidden="true" />
                      {item.location}
                    </span>
                  )}
                </span>
                <StatusPill status={item.status} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
