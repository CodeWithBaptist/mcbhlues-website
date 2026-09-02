import Link from "next/link";
import { Mail, Phone, MapPin, Facebook, Instagram, Twitter, Linkedin } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Logo } from "@/components/ui/logo";
import { SITE_CONFIG, NAV_LINKS, SOCIAL_LINKS } from "@/constants";
import type { CompanyInfo } from "@/lib/settings/company";

const iconMap: Record<string, any> = {
  Facebook,
  Instagram,
  Twitter,
  Linkedin,
};

export function Footer({ company }: { company?: CompanyInfo }) {
  const contact = {
    address: company?.address || SITE_CONFIG.contact.address,
    phone: company?.phone || SITE_CONFIG.contact.phone,
    email: company?.email || SITE_CONFIG.contact.email,
  };
  const companyName = company?.name || SITE_CONFIG.name;
  // Social URLs from Portal → Company Settings win over the shipped placeholders.
  const socialLinks = SOCIAL_LINKS.map((social) => ({
    ...social,
    href: company?.socials?.[social.title.toLowerCase() as keyof CompanyInfo["socials"]] || social.href,
  }));
  return (
    <footer className="bg-dark text-white pt-20 pb-10">
      <Container>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          {/* Brand Column */}
          <div className="flex flex-col gap-6">
            <Logo light logoUrl={company?.logoUrl} name={companyName} />
            <p className="text-gray-400 leading-relaxed">
              Leading the way in luxury real estate, property development, and high-end facility management. Elevating lifestyles through excellence.
            </p>
            <div className="flex gap-4">
              {socialLinks.map((social) => {
                const Icon = iconMap[social.icon];
                return (
                  <a
                    key={social.title}
                    href={social.href}
                    className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-primary transition-colors"
                    aria-label={social.title}
                  >
                    {Icon && <Icon className="w-5 h-5" />}
                  </a>
                );
              })}
            </div>
          </div>

          {/* Quick Links */}
          <div className="flex flex-col gap-6">
            <h3 className="text-xl font-bold font-heading">Quick Links</h3>
            <ul className="flex flex-col gap-4">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-gray-400 hover:text-primary transition-colors"
                  >
                    {link.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div className="flex flex-col gap-6">
            <h3 className="text-xl font-bold font-heading">Our Services</h3>
            <ul className="flex flex-col gap-4">
              {["Real Estate Consulting", "Property Development", "Facility Management", "Luxury Rentals"].map((service) => (
                <li key={service} className="text-gray-400">
                  {service}
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div className="flex flex-col gap-6">
            <h3 className="text-xl font-bold font-heading">Contact Us</h3>
            <ul className="flex flex-col gap-6">
              <li className="flex gap-4">
                <MapPin className="w-6 h-6 text-primary shrink-0" />
                <span className="text-gray-400">{contact.address}</span>
              </li>
              <li className="flex gap-4">
                <Phone className="w-6 h-6 text-primary shrink-0" />
                <span className="text-gray-400">{contact.phone}</span>
              </li>
              <li className="flex gap-4">
                <Mail className="w-6 h-6 text-primary shrink-0" />
                <span className="text-gray-400">{contact.email}</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-500">
          <p>© {new Date().getFullYear()} {companyName}. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="#" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="#" className="hover:text-white transition-colors">Terms of Service</Link>
            <Link href="/portal" className="hover:text-white transition-colors">Staff Portal</Link>
          </div>
        </div>
      </Container>
    </footer>
  );
}
