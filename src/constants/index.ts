/**
 * Canonical, absolute origin for the public website.
 *
 * Used for `metadataBase`, canonical URLs, Open Graph tags, the sitemap and
 * robots.txt. Override per-environment with `NEXT_PUBLIC_SITE_URL` (e.g. a
 * Vercel preview deployment) — it must be an absolute URL with no trailing
 * slash.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://mcbhlues.com"
).replace(/\/+$/, "");

export const SITE_CONFIG = {
  /**
   * The full business name — the company as a legal/commercial entity.
   *
   * Use this wherever the *company* is being named: the `Organization` schema
   * node, the page-title suffix, `creator`/`publisher` metadata, the footer
   * copyright and email signatures. Portal → Company Settings
   * (`company.name`) is the source of truth at runtime and falls back here.
   */
  name: "MCBHLUES Enterprises",

  /**
   * The public-facing brand — the wordmark rendered in the navbar and footer
   * logo ("MCBHLUES" large, "Enterprises" as the subtitle beneath it).
   *
   * This is the primary branded search term and the `schema:brand` value, so
   * it is the name attached to the *website* (`WebSite.name`, `og:site_name`).
   */
  brand: "MCBHLUES",

  url: SITE_URL,
  /** Used as the homepage <title> and the Open Graph site title. */
  tagline: "Real Estate Consulting, Development & Facility Management in Lagos",
  description:
    "Real estate consulting, property development and facility management in Lagos, Nigeria from MCBHLUES Enterprises.",
  contact: {
    email: "info@mcbhlues.com",
    phone: "+234 800 000 0000",
    address: "14 Akin Adesola Street, Victoria Island, Lagos, Nigeria",
  },
  location: {
    city: "Lagos",
    state: "Lagos",
    country: "Nigeria",
  },
};

/**
 * The single, site-wide primary call to action. Every page funnels visitors to
 * this one action — secondary links are deliberately styled as low-emphasis so
 * there is never more than one obvious next step on a screen.
 */
export const PRIMARY_CTA = {
  label: "Book a Free Consultation",
  shortLabel: "Book a Consultation",
  href: "/contact",
} as const;

export const NAV_LINKS = [
  { title: "Home", href: "/" },
  { title: "About", href: "/about" },
  { title: "Properties", href: "/properties" },
  { title: "Buy", href: "/buy" },
  { title: "Rent", href: "/rent" },
  { title: "Favorites", href: "/favorites" },
  { title: "Contact", href: "/contact" },
];

/** Footer-only links. Kept out of NAV_LINKS so they stay out of the sitemap's
 *  high-priority set and out of the main navigation. */
export const LEGAL_LINKS = [
  { title: "Privacy Policy", href: "/privacy" },
  { title: "Terms & Conditions", href: "/terms" },
  { title: "Cookie Policy", href: "/cookies" },
];

/**
 * Social profiles. `href` is intentionally empty: real URLs are configured in
 * Portal → Company Settings. Icons without a configured URL are not rendered
 * at all, so the footer never ships dead `#` links.
 */
export const SOCIAL_LINKS = [
  { title: "Facebook", href: "", icon: "Facebook" },
  { title: "Instagram", href: "", icon: "Instagram" },
  { title: "Twitter", href: "", icon: "Twitter" },
  { title: "LinkedIn", href: "", icon: "Linkedin" },
];

export const SERVICES = [
  {
    id: "consulting",
    title: "Real Estate Consulting",
    description: "Buyer and investor advice on search, valuation, financing and purchase. We turn your brief into a shortlist you approve before any viewing.",
    icon: "Briefcase",
  },
  {
    id: "development",
    title: "Property Development",
    description: "We plan, build and deliver residential and commercial projects, from land and design through construction to inspection and handover.",
    icon: "Building2",
  },
  {
    id: "facility",
    title: "Facility Management",
    description: "Ongoing management for owners and tenants: maintenance, cleaning, security and building operations, run by one accountable team.",
    icon: "ShieldCheck",
  },
];
