import { Property } from "@/types";

export const SITE_CONFIG = {
  name: "MCBHLUES ENTERPRISES",
  description: "Luxury Real Estate Consulting, Property Development & Facility Management",
  contact: {
    email: "info@mcbhlues.com",
    phone: "+1 (555) 000-0000",
    address: "123 Business Avenue, Suite 100, Financial District",
  },
};

export const NAV_LINKS = [
  { title: "Home", href: "/" },
  { title: "About", href: "/about" },
  { title: "Properties", href: "/properties" },
  { title: "Buy", href: "/buy" },
  { title: "Rent", href: "/rent" },
  { title: "Favorites", href: "/favorites" },
  { title: "Contact", href: "/contact" },
];

export const SOCIAL_LINKS = [
  { title: "Facebook", href: "#", icon: "Facebook" },
  { title: "Instagram", href: "#", icon: "Instagram" },
  { title: "Twitter", href: "#", icon: "Twitter" },
  { title: "LinkedIn", href: "#", icon: "Linkedin" },
];

export const DUMMY_PROPERTIES: Property[] = [
  {
    id: "1",
    title: "Azure Sky Penthouse",
    price: 2500000,
    location: "Skyline District, NY",
    beds: 3,
    baths: 3,
    sqft: 3200,
    image: "/properties/p1.jpg",
    type: "sale",
    status: "available",
  },
  {
    id: "2",
    title: "Coastal Pearl Villa",
    price: 4500,
    location: "Malibu Beach, CA",
    beds: 5,
    baths: 4,
    sqft: 4800,
    image: "/properties/p2.jpg",
    type: "rent",
    status: "available",
  },
  {
    id: "3",
    title: "Urban Oasis Loft",
    price: 1200000,
    location: "Downtown Chicago, IL",
    beds: 2,
    baths: 2,
    sqft: 1800,
    image: "/properties/p3.jpg",
    type: "sale",
    status: "available",
  },
  {
    id: "4",
    title: "Emerald Estate",
    price: 5800000,
    location: "Beverly Hills, CA",
    beds: 6,
    baths: 7,
    sqft: 8500,
    image: "/properties/p4.jpg",
    type: "sale",
    status: "available",
  },
  {
    id: "5",
    title: "Harbor View Suite",
    price: 3200,
    location: "Boston Harbor, MA",
    beds: 1,
    baths: 1,
    sqft: 950,
    image: "/properties/p5.jpg",
    type: "rent",
    status: "available",
  },
  {
    id: "6",
    title: "Alpine Retreat Lodge",
    price: 890000,
    location: "Aspen, CO",
    beds: 4,
    baths: 3,
    sqft: 3600,
    image: "/properties/p6.jpg",
    type: "sale",
    status: "available",
  },
];

export const SERVICES = [
  {
    id: "consulting",
    title: "Real Estate Consulting",
    description: "Expert guidance for luxury investments, market analysis, and strategic property acquisitions tailored to your portfolio goals.",
    icon: "Briefcase",
  },
  {
    id: "development",
    title: "Property Development",
    description: "From visionary concept to architectural masterpiece, we develop premium residential and commercial properties that redefine skylines.",
    icon: "Building2",
  },
  {
    id: "facility",
    title: "Facility Management",
    description: "Comprehensive, high-touch management services ensuring your properties maintain impeccable standards and operational excellence.",
    icon: "ShieldCheck",
  },
];


