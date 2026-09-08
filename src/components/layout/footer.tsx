import Link from "next/link";
import { Mail, Phone, MapPin, Facebook, Instagram, Twitter, Linkedin } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Logo } from "@/components/ui/logo";
import { CookieSettingsLink } from "@/components/layout/cookie-consent";
import { SITE_CONFIG, NAV_LINKS, SOCIAL_LINKS, LEGAL_LINKS, SERVICES } from "@/constants";
import type { CompanyInfo } from "@/lib/settings/company";

const iconMap: Record<string, LucideIcon> = {
  Facebook,
  Instagram,
  Twitter,
  Linkedin,
};

/** Only http(s) URLs are rendered — a mis-typed setting must not become a link. */
function safeUrl(value: string | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  try {
    const url = new URL(trimmed);
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

export function Footer({ company }: { company?: CompanyInfo }) {
  const contact = {
    address: company?.address || SITE_CONFIG.contact.address,
    phone: company?.phone || SITE_CONFIG.contact.phone,
    email: company?.email || SITE_CONFIG.contact.email,
  };
  const companyName = company?.name || SITE_CONFIG.name;
  const telHref = `tel:${contact.phone.replace(/[^\d+]/g, "")}`;

  // Social URLs come from Portal → Company Settings. Icons with no configured
  // URL are dropped entirely rather than shipped as dead `#` links.
  const socialLinks = SOCIAL_LINKS.map((social) => ({
    ...social,
    href: safeUrl(
      company?.socials?.[social.title.toLowerCase() as keyof CompanyInfo["socials"]] ||
        social.href
    ),
  })).filter((social): social is typeof social & { href: string } => Boolean(social.href));

  return (
    <footer className="bg-dark pb-10 pt-20 text-white">
      {/* Hairline brand accent along the very top of the footer. */}
      <div
        className="mx-auto mb-16 h-px w-full max-w-7xl bg-white/10"
        aria-hidden="true"
      />
      <Container>
        <div className="mb-16 grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand Column */}
          <div className="flex flex-col gap-6">
            <Logo light logoUrl={company?.logoUrl} name={companyName} />
            <p className="leading-relaxed text-gray-300">
              {companyName} provides real estate consulting, property development
              and facility management. We help clients buy, build and manage
              property through one team.
            </p>
            {socialLinks.length > 0 && (
              <ul className="flex gap-4">
                {socialLinks.map((social) => {
                  const Icon = iconMap[social.icon];
                  return (
                    <li key={social.title}>
                      <a
                        href={social.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 transition-colors duration-200 ease-soft hover:bg-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                      >
                        {Icon && <Icon className="h-5 w-5" aria-hidden="true" />}
                        <span className="sr-only">
                          {companyName} on {social.title} (opens in a new tab)
                        </span>
                      </a>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Quick Links */}
          <nav className="flex flex-col gap-6" aria-labelledby="footer-quick-links">
            <h2 id="footer-quick-links" className="font-heading text-xl font-bold">
              Quick Links
            </h2>
            <ul className="flex flex-col gap-4">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="link-underline w-fit text-gray-300 transition-colors duration-200 hover:text-primary-light"
                  >
                    {link.title}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Services */}
          <div className="flex flex-col gap-6">
            <h2 className="font-heading text-xl font-bold">Our Services</h2>
            <ul className="flex flex-col gap-4">
              {SERVICES.map((service) => (
                <li key={service.id} className="text-gray-300">
                  {service.title}
                </li>
              ))}
              <li className="text-gray-300">Luxury Rentals</li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="flex flex-col gap-6">
            <h2 className="font-heading text-xl font-bold">Contact Us</h2>
            <ul className="flex flex-col gap-6">
              <li className="flex gap-4">
                <MapPin className="h-6 w-6 shrink-0 text-primary-light" aria-hidden="true" />
                <span className="text-gray-300">{contact.address}</span>
              </li>
              <li className="flex gap-4">
                <Phone className="h-6 w-6 shrink-0 text-primary-light" aria-hidden="true" />
                <a href={telHref} className="link-underline w-fit text-gray-300 transition-colors duration-200 hover:text-white">
                  {contact.phone}
                </a>
              </li>
              <li className="flex gap-4">
                <Mail className="h-6 w-6 shrink-0 text-primary-light" aria-hidden="true" />
                <a
                  href={`mailto:${contact.email}`}
                  className="link-underline break-all text-gray-300 transition-colors duration-200 hover:text-white"
                >
                  {contact.email}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-4 border-t border-white/15 pt-8 text-sm text-gray-300 md:flex-row">
          <p>
            © {new Date().getFullYear()} {companyName}. All rights reserved.
          </p>
          <nav aria-label="Legal">
            <ul className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
              {LEGAL_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="link-underline transition-colors duration-200 hover:text-white">
                    {link.title}
                  </Link>
                </li>
              ))}
              <li>
                <CookieSettingsLink className="cursor-pointer underline-offset-4 transition-colors duration-200 hover:text-white hover:underline" />
              </li>
              <li>
                <Link href="/portal/login" className="link-underline transition-colors duration-200 hover:text-white">
                  Staff Portal
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </Container>
    </footer>
  );
}
