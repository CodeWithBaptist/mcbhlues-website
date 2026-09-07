/**
 * Initial property catalogue so the public website has real, published
 * listings when the properties table is first created. Afterwards every row
 * is ordinary data managed entirely from the Staff Portal Properties module.
 * Existing catalogues, including empty ones, are never repopulated on boot.
 *
 * All seed listings are based in Nigeria (prices in Nigerian Naira). The map
 * coordinates are optional: leave latitude/longitude empty and the public page
 * will simply not show a map for that listing.
 *
 * Images are placeholder URLs (picsum.photos stable seeds so they load in
 * sandboxed previews without an API key). Replace them with real photography
 * (or upload URLs) from the portal.
 */

export interface PropertySeed {
  slug: string;
  /** Short marketing headline for the listing header. */
  title: string;
  /** Plain listing/building name shown on cards. */
  name: string;
  description: string;
  type: "sale" | "rent";
  status: "available" | "sold" | "pending" | "rented";
  price: number;
  beds: number;
  baths: number;
  sqm: number;
  yearBuilt: number;
  address: string;
  city: string;
  state: string;
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
    title: "Skyline living above Victoria Island",
    name: "Azure Sky Penthouse",
    description:
      "A penthouse on Victoria Island with wide balconies, an open plan living floor and a wraparound view across the Lagos Lagoon. Finished with porcelain floors, glass balcony rails and full smart-home automation.",
    type: "sale",
    status: "available",
    price: 350000000,
    beds: 4,
    baths: 5,
    sqm: 390,
    yearBuilt: 2021,
    address: "12 Adeola Odeku Street, Victoria Island",
    city: "Lagos",
    state: "Lagos",
    country: "Nigeria",
    latitude: "6.4281",
    longitude: "3.4219",
    isFeatured: true,
    amenities: [
      { name: "Covered Parking", icon: "CarFront" },
      { name: "24h Power Supply", icon: "Zap" },
      { name: "Serviced Lift", icon: "MoveUpRight" },
      { name: "CCTV & Security", icon: "ShieldCheck" },
    ],
    features: ["Lagoon View", "Smart Home System", "24h Power Supply", "Standby Generator"],
    images: [
      "https://picsum.photos/seed/azure-sky-1/1200/800",
      "https://picsum.photos/seed/azure-sky-2/800/600",
      "https://picsum.photos/seed/azure-sky-3/800/600",
    ],
  },
  {
    slug: "banana-island-villa",
    title: "Private waterfront villa in Banana Island",
    name: "Harbour Pearl Villa",
    description:
      "A four bedroom duplex villa on the Banana Island waterfront with a private garden, a plunge pool and direct access to the island's serviced roads and 24h security estate.",
    type: "sale",
    status: "available",
    price: 650000000,
    beds: 4,
    baths: 5,
    sqm: 557,
    yearBuilt: 2019,
    address: "Plot 7, Banana Island Road, Ikoyi",
    city: "Lagos",
    state: "Lagos",
    country: "Nigeria",
    latitude: "6.4490",
    longitude: "3.4305",
    isFeatured: true,
    amenities: [
      { name: "Private Garden", icon: "Trees" },
      { name: "Plunge Pool", icon: "Waves" },
      { name: "Estate Security", icon: "ShieldCheck" },
      { name: "Staff Quarters", icon: "BedDouble" },
    ],
    features: ["Waterfront Plot", "Plunge Pool", "Staff Quarters", "24h Estate Security"],
    images: [
      "https://picsum.photos/seed/banana-island-1/1200/800",
      "https://picsum.photos/seed/banana-island-2/800/600",
      "https://picsum.photos/seed/banana-island-3/800/600",
    ],
  },
  {
    slug: "lekki-loft",
    title: "Contemporary apartment in Lekki Phase 1",
    name: "Urban Oasis Loft",
    description:
      "A two bedroom serviced apartment in Lekki Phase 1 with a fitted kitchen, en-suite bathrooms and access to the estate's gym and 24h security. Well placed near the Lekki-Ikoyi link bridge and Admiralty Way.",
    type: "rent",
    status: "available",
    price: 12000000,
    beds: 2,
    baths: 2,
    sqm: 130,
    yearBuilt: 2020,
    address: "15 Admiralty Way, Lekki Phase 1",
    city: "Lekki",
    state: "Lagos",
    country: "Nigeria",
    latitude: "6.4478",
    longitude: "3.4723",
    isFeatured: true,
    amenities: [
      { name: "Gym Access", icon: "Dumbbell" },
      { name: "24h Power Supply", icon: "Zap" },
      { name: "Fitted Kitchen", icon: "ChefHat" },
      { name: "Estate Security", icon: "ShieldCheck" },
    ],
    features: ["Fitted Kitchen", "En-Suite Bathrooms", "24h Power Supply", "Close to Link Bridge"],
    images: [
      "https://picsum.photos/seed/lekki-loft-1/1200/800",
      "https://picsum.photos/seed/lekki-loft-2/800/600",
      "https://picsum.photos/seed/lekki-loft-3/800/600",
    ],
  },
  {
    slug: "ikoyi-family-home",
    title: "Family duplex in a quiet Ikoyi street",
    name: "Emerald Residence",
    description:
      "A five bedroom detached family home on a gated street in Ikoyi with a large sitting room, study, guest toilet and a generous compound with a children's play area and domestic staff room.",
    type: "sale",
    status: "available",
    price: 480000000,
    beds: 5,
    baths: 6,
    sqm: 539,
    yearBuilt: 2018,
    address: "23 Bourdillon Road, Ikoyi",
    city: "Lagos",
    state: "Lagos",
    country: "Nigeria",
    latitude: "",
    longitude: "",
    isFeatured: false,
    amenities: [
      { name: "Gated Street", icon: "Lock" },
      { name: "Children's Play Area", icon: "Baby" },
      { name: "Staff Room", icon: "BedDouble" },
      { name: "Backup Power", icon: "Zap" },
    ],
    features: ["Detached Duplex", "Study", "Play Area", "Quiet Gated Street"],
    images: [
      "https://picsum.photos/seed/ikoyi-home-1/1200/800",
      "https://picsum.photos/seed/ikoyi-home-2/800/600",
      "https://picsum.photos/seed/ikoyi-home-3/800/600",
    ],
  },
  {
    slug: "yaba-studio",
    title: "Compact studio near Yaba tech hub",
    name: "Yaba Workspace Studio",
    description:
      "A furnished studio apartment close to the Yaba tech cluster, ideal for young professionals. Includes a working desk, fast fibre internet and all-inclusive utility billing.",
    type: "rent",
    status: "available",
    price: 1800000,
    beds: 1,
    baths: 1,
    sqm: 45,
    yearBuilt: 2022,
    address: "8 Herbert Macaulay Way, Yaba",
    city: "Lagos",
    state: "Lagos",
    country: "Nigeria",
    latitude: "",
    longitude: "",
    isFeatured: false,
    amenities: [
      { name: "Fibre Internet", icon: "Wifi" },
      { name: "Furnished", icon: "Armchair" },
      { name: "Working Desk", icon: "Laptop" },
      { name: "Water & Power Included", icon: "Zap" },
    ],
    features: ["Fully Furnished", "Fibre Internet", "All-Inclusive Billing", "Close to Tech Hub"],
    images: [
      "https://picsum.photos/seed/yaba-studio-1/1200/800",
      "https://picsum.photos/seed/yaba-studio-2/800/600",
    ],
  },
  {
    slug: "abuja-crescent-home",
    title: "Four bedroom terrace in Wuse II, Abuja",
    name: "Crescent Court",
    description:
      "A well finished four bedroom terrace house in the Wuse II district of Abuja, with en-suites, a fitted kitchen, a neat compound and reliable power supply within a secure neighbourhood.",
    type: "sale",
    status: "available",
    price: 220000000,
    beds: 4,
    baths: 5,
    sqm: 297,
    yearBuilt: 2017,
    address: "Plot 41, Aminu Kano Crescent, Wuse II",
    city: "Abuja",
    state: "FCT",
    country: "Nigeria",
    latitude: "9.0765",
    longitude: "7.3986",
    isFeatured: false,
    amenities: [
      { name: "Fitted Kitchen", icon: "ChefHat" },
      { name: "Secure Neighbourhood", icon: "ShieldCheck" },
      { name: "Backup Power", icon: "Zap" },
      { name: "Parking", icon: "CarFront" },
    ],
    features: ["Terrace House", "En-Suite Bathrooms", "Fitted Kitchen", "Wuse II Location"],
    images: [
      "https://picsum.photos/seed/abuja-home-1/1200/800",
      "https://picsum.photos/seed/abuja-home-2/800/600",
    ],
  },
];
