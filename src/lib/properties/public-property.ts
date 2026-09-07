import type { Property } from "@/types";
import type { PropertyWithDetails } from "./property-service";

/** Build a combined "City, State" display string from a property's address fields. */
export function locationLabel(property: {
  city?: string;
  state?: string;
  country?: string;
  address?: string;
}): string {
  const parts = [property.city, property.state].filter(Boolean);
  if (parts.length > 0) return parts.join(", ");
  if (property.country) return property.country;
  if (property.address) return property.address;
  return "Location on request";
}

/** True when a listing has enough detail to render a map on the public page. */
export function hasMapLocation(property: {
  latitude?: string;
  longitude?: string;
  city?: string;
  state?: string;
  address?: string;
}): boolean {
  const hasCoords = Boolean(
    property.latitude &&
      property.longitude &&
      Number.isFinite(Number(property.latitude)) &&
      Number.isFinite(Number(property.longitude))
  );
  const hasText = Boolean(
    property.address || property.city || property.state
  );
  return hasCoords || hasText;
}

/** Pick the primary image (or the first available image), else a placeholder. */
export function primaryImage(property: { images: { url: string; isPrimary: boolean }[] }): string {
  const image = property.images.find((row) => row.isPrimary) ?? property.images[0];
  return image?.url ?? "";
}

/** Convert a full portal property row into the shape the public site consumes. */
export function toPublicProperty(details: PropertyWithDetails): Property {
  return {
    id: details.id,
    slug: details.slug,
    title: details.title,
    name: details.name,
    description: details.description,
    price: details.price,
    currency: details.currency,
    type: details.type,
    status: details.status,
    beds: details.beds,
    baths: details.baths,
    sqft: details.sqft,
    yearBuilt: details.yearBuilt,
    location: locationLabel(details),
    address: details.address,
    city: details.city,
    state: details.state,
    country: details.country,
    image: primaryImage(details),
    images: details.images.map((row) => row.url),
    amenities: details.amenities.map((row) => row.name),
    features: details.features.map((row) => row.label),
    latitude: details.latitude,
    longitude: details.longitude,
    isFeatured: details.isFeatured,
  };
}
