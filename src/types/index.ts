export interface NavItem {
  title: string;
  href: string;
}

export interface Service {
  id: string;
  title: string;
  description: string;
  icon: string;
}

/**
 * Shape consumed by the public website components. Derived from the database
 * `PropertyWithDetails` rows via `toPublicProperty` — the site never touches
 * the raw portal rows directly.
 */
export interface Property {
  id: string;
  slug: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  type: "sale" | "rent";
  status: string;
  beds: number;
  baths: number;
  sqft: number;
  yearBuilt?: number | null;
  location: string;
  address: string;
  city: string;
  state: string;
  image: string;
  images: string[];
  amenities: string[];
  features: string[];
  latitude: string;
  longitude: string;
  isFeatured: boolean;
}
