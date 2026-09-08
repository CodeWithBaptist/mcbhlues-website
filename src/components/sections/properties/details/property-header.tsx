import { MapPin } from "lucide-react";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Property } from "@/types";
import { buttonClasses } from "@/components/ui/button";
import { SaveButton } from "@/components/ui/save-button";

interface PropertyHeaderProps {
  property: Property;
}

const STATUS_LABEL: Record<string, string> = {
  available: "Available",
  pending: "Sale pending",
  sold: "Sold",
  rented: "Let agreed",
};

/**
 * Listing title block: what it is, where it is, what it costs, and the one
 * action we want (arrange a viewing). Server component — nothing here needs
 * client JavaScript except the save button, which is its own island.
 */
export function PropertyHeader({ property }: PropertyHeaderProps) {
  const forSale = property.type === "sale";

  return (
    <section className="border-b border-gray-100 bg-white py-8 sm:py-10">
      <Container>
        <nav aria-label="Breadcrumb" className="mb-5 text-sm text-gray-500">
          <ol className="flex flex-wrap items-center gap-2">
            <li>
              <Link href="/" className="transition-colors duration-200 hover:text-primary">
                Home
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <Link href="/properties" className="transition-colors duration-200 hover:text-primary">
                Properties
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li aria-current="page" className="text-gray-700">
              {property.name}
            </li>
          </ol>
        </nav>

        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div className="min-w-0">
            <div className="mb-4 flex flex-wrap gap-2">
              <Badge variant={forSale ? "primary" : "secondary"}>
                For {forSale ? "Sale" : "Rent"}
              </Badge>
              {property.status !== "available" && (
                <Badge variant="light">{STATUS_LABEL[property.status] ?? property.status}</Badge>
              )}
            </div>
            <h1 className="mb-2 font-heading text-3xl font-bold tracking-tight text-dark md:text-4xl">
              {property.name}
            </h1>
            {property.title && property.title !== property.name && (
              <p className="mb-2 text-lg text-gray-600 md:text-xl">{property.title}</p>
            )}
            <p className="flex items-center gap-2 text-gray-600">
              <MapPin className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
              <span className="text-base sm:text-lg">{property.location}</span>
            </p>
          </div>

          <div className="flex flex-col items-start gap-4 md:items-end">
            <p className="font-heading text-3xl font-bold tabular-nums text-dark md:text-4xl">
              {formatCurrency(property.price, property.currency)}
              {!forSale && <span className="text-lg font-medium text-gray-500"> / month</span>}
            </p>
            <div className="flex items-center gap-3">
              {/* Utility control, deliberately quieter than the single primary CTA. */}
              <SaveButton
                propertyId={property.id}
                propertyName={property.name}
                className="border border-gray-200 shadow-none"
              />
              <Link href="#inquiry" className={buttonClasses({ size: "lg" })}>
                Arrange a viewing
              </Link>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
