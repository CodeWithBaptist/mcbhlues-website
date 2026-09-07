import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Logo } from "@/components/ui/logo";
import { NotFoundContent } from "@/components/sections/not-found-content";
import { LEGAL_LINKS, NAV_LINKS, SITE_CONFIG } from "@/constants";

/**
 * Global 404. Next renders this for any URL that matches no route, using the
 * *root* layout only — so it carries its own lightweight header and footer
 * rather than the data-driven ones from the `(site)` layout (which would need a
 * database round-trip just to render an error page).
 */
export const metadata: Metadata = {
  title: "Page not found",
  description:
    "The page you were looking for doesn't exist. Browse our Lagos property listings or talk to a MCBHLUES Enterprises consultant.",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <div className="public-site flex min-h-screen flex-col">
      <header className="border-b border-gray-100">
        <Container>
          <div className="flex items-center justify-between py-5">
            <Logo />
            <nav aria-label="Primary" className="hidden gap-6 sm:flex">
              {NAV_LINKS.filter((link) => link.title !== "Favorites").map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm font-medium text-dark transition-colors hover:text-primary"
                >
                  {link.title}
                </Link>
              ))}
            </nav>
          </div>
        </Container>
      </header>

      <main id="main-content" className="flex-grow">
        <NotFoundContent />
      </main>

      <footer className="border-t border-gray-100 py-8">
        <Container>
          <div className="flex flex-col items-center justify-between gap-4 text-sm text-gray-600 sm:flex-row">
            <p>
              © {new Date().getFullYear()} {SITE_CONFIG.name}. All rights reserved.
            </p>
            <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
              {LEGAL_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="transition-colors hover:text-primary"
                >
                  {link.title}
                </Link>
              ))}
            </div>
          </div>
        </Container>
      </footer>
    </div>
  );
}
