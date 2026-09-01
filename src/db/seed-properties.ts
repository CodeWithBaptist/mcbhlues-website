/**
 * Initial property catalogue so the public website has real, published
 * listings on first boot. Seeded exactly once (by slug); afterwards every row
 * is ordinary data managed entirely from the Staff Portal Properties module.
 *
 * Images use picsum.photos stable seeds — keyless and iframe-friendly, so they
 * load in sandboxed previews without any API key. Replace them with real
 * photography (or upload URLs) from the portal.
 */

export interface PropertySeed {
  slug: string;
  title: string;
  description: string;
  type: "sale" | "rent";
  status: "available" | "sold" | "pending" | "rented";
  price: number;
  beds: number;
  baths: number;
  sqft: number;
  yearBuilt: number;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  latitude: string;
  longitude: string;
  isFeatured: boolean;
  amenities: { name: string; icon: string }[];
  features: string[];
  images: string[];
}

export const PROPERTY_SEED: PropertySeed[] = [
  {
    slug: "azure-sky-penthouse",
    title: "Azure Sky Penthouse",
    description:
      "A soaring penthouse in the heart of the Skyline District with floor-to-ceiling glass, a wraparound terrace and uninterrupted city views. Every finish is bespoke — Italian marble, smart home automation and a private elevator lobby.",
    type: "sale",
    status: "available",
    price: 2500000,
    beds: 3,
    baths: 3,
    sqft: 3200,
    yearBuilt: 2020,
    address: "88 Skyline Avenue, PH-1",
    city: "New York",
    state: "NY",
    postalCode: "10001",
    country: "USA",
    latitude: "40.7580",
    longitude: "-73.9855",
    isFeatured: true,
    amenities: [
      { name: "Private Elevator", icon: "MoveUpRight" },
      { name: "Concierge", icon: "BellRing" },
      { name: "Rooftop Pool", icon: "Waves" },
      { name: "Fitness Center", icon: "Dumbbell" },
    ],
    features: ["Smart Home System", "Wraparound Terrace", "Italian Marble Floors", "Floor-to-Ceiling Glass"],
    images: [
      "https://picsum.photos/seed/azure-sky-1/1200/800",
      "https://picsum.photos/seed/azure-sky-2/800/600",
      "https://picsum.photos/seed/azure-sky-3/800/600",
      "https://picsum.photos/seed/azure-sky-4/800/600",
    ],
  },
  {
    slug: "coastal-pearl-villa",
    title: "Coastal Pearl Villa",
    description:
      "An oceanfront estate in Malibu with a private beach path, infinity pool and expansive entertaining terraces. Five en-suite bedrooms open onto panoramic Pacific views.",
    type: "rent",
    status: "available",
    price: 4500,
    beds: 5,
    baths: 4,
    sqft: 4800,
    yearBuilt: 2018,
    address: "12 Ocean Drive",
    city: "Malibu",
    state: "CA",
    postalCode: "90265",
    country: "USA",
    latitude: "34.0259",
    longitude: "-118.7798",
    isFeatured: true,
    amenities: [
      { name: "Infinity Pool", icon: "Waves" },
      { name: "Private Beach", icon: "Umbrella" },
      { name: "Outdoor Kitchen", icon: "ChefHat" },
      { name: "Gated Entrance", icon: "Lock" },
    ],
    features: ["Ocean View", "Infinity Pool", "Private Beach Access", "Outdoor Kitchen"],
    images: [
      "https://picsum.photos/seed/coastal-pearl-1/1200/800",
      "https://picsum.photos/seed/coastal-pearl-2/800/600",
      "https://picsum.photos/seed/coastal-pearl-3/800/600",
    ],
  },
  {
    slug: "urban-oasis-loft",
    title: "Urban Oasis Loft",
    description:
      "A bright, industrial-chic loft in Downtown Chicago with 14-foot ceilings, exposed brick and a private courtyard garden — a calm retreat in the middle of the city.",
    type: "sale",
    status: "available",
    price: 1200000,
    beds: 2,
    baths: 2,
    sqft: 1800,
    yearBuilt: 2016,
    address: "440 W Randolph St",
    city: "Chicago",
    state: "IL",
    postalCode: "60606",
    country: "USA",
    latitude: "41.8843",
    longitude: "-87.6384",
    isFeatured: true,
    amenities: [
      { name: "Courtyard Garden", icon: "Sprout" },
      { name: "Bike Storage", icon: "Bike" },
      { name: "Pet Friendly", icon: "PawPrint" },
      { name: "Storage Unit", icon: "Boxes" },
    ],
    features: ["Exposed Brick", "14-Foot Ceilings", "Private Courtyard", "Chef's Kitchen"],
    images: [
      "https://picsum.photos/seed/urban-oasis-1/1200/800",
      "https://picsum.photos/seed/urban-oasis-2/800/600",
      "https://picsum.photos/seed/urban-oasis-3/800/600",
    ],
  },
  {
    slug: "emerald-estate",
    title: "Emerald Estate",
    description:
      "A sprawling Beverly Hills compound with manicured grounds, a resort-grade pool and a separate guest wing. Designed for grand entertaining and complete privacy.",
    type: "sale",
    status: "available",
    price: 5800000,
    beds: 6,
    baths: 7,
    sqft: 8500,
    yearBuilt: 2015,
    address: "1001 Emerald Way",
    city: "Beverly Hills",
    state: "CA",
    postalCode: "90210",
    country: "USA",
    latitude: "34.0901",
    longitude: "-118.4065",
    isFeatured: false,
    amenities: [
      { name: "Resort Pool", icon: "Waves" },
      { name: "Home Theater", icon: "Clapperboard" },
      { name: "Wine Cellar", icon: "Wine" },
      { name: "Staff Quarters", icon: "BedDouble" },
    ],
    features: ["Resort Pool", "Home Theater", "Wine Cellar", "Guest Wing"],
    images: [
      "https://picsum.photos/seed/emerald-estate-1/1200/800",
      "https://picsum.photos/seed/emerald-estate-2/800/600",
      "https://picsum.photos/seed/emerald-estate-3/800/600",
    ],
  },
  {
    slug: "harbor-view-suite",
    title: "Harbor View Suite",
    description:
      "A refined one-bedroom suite overlooking Boston Harbor, steps from the waterfront and minutes to downtown. Bright, efficient and beautifully appointed.",
    type: "rent",
    status: "available",
    price: 3200,
    beds: 1,
    baths: 1,
    sqft: 950,
    yearBuilt: 2021,
    address: "5 Harbor Walk",
    city: "Boston",
    state: "MA",
    postalCode: "02110",
    country: "USA",
    latitude: "42.3601",
    longitude: "-71.0589",
    isFeatured: false,
    amenities: [
      { name: "Harbor View", icon: "Sailboat" },
      { name: "Rooftop Lounge", icon: "Sunset" },
      { name: "Concierge", icon: "BellRing" },
      { name: "Fitness Center", icon: "Dumbbell" },
    ],
    features: ["Harbor View", "Rooftop Lounge", "In-Unit Laundry", "High-Speed Internet"],
    images: [
      "https://picsum.photos/seed/harbor-view-1/1200/800",
      "https://picsum.photos/seed/harbor-view-2/800/600",
    ],
  },
  {
    slug: "alpine-retreat-lodge",
    title: "Alpine Retreat Lodge",
    description:
      "A cozy mountain lodge in Aspen built from stone and timber, with ski-in access, a roaring great-room fireplace and stunning valley views from every window.",
    type: "sale",
    status: "available",
    price: 890000,
    beds: 4,
    baths: 3,
    sqft: 3600,
    yearBuilt: 2013,
    address: "77 Powder Ridge Rd",
    city: "Aspen",
    state: "CO",
    postalCode: "81611",
    country: "USA",
    latitude: "39.1911",
    longitude: "-106.8175",
    isFeatured: false,
    amenities: [
      { name: "Ski-In Access", icon: "Snowflake" },
      { name: "Stone Fireplace", icon: "Flame" },
      { name: "Hot Tub", icon: "Waves" },
      { name: "Boot Room", icon: "Footprints" },
    ],
    features: ["Ski-In Access", "Stone Fireplace", "Hot Tub", "Mountain Views"],
    images: [
      "https://picsum.photos/seed/alpine-retreat-1/1200/800",
      "https://picsum.photos/seed/alpine-retreat-2/800/600",
    ],
  },
];
