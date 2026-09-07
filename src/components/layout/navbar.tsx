"use client";

import { useEffect, useId, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Phone, Heart } from "lucide-react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { NAV_LINKS, PRIMARY_CTA, SITE_CONFIG } from "@/constants";
import { Container } from "@/components/ui/container";
import { buttonClasses } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { useFavorites } from "@/lib/favorites";

interface NavbarProps {
  /** From Portal → Company Settings; falls back to the shipped constants. */
  phone?: string;
  logoUrl?: string | null;
  companyName?: string;
}

export function Navbar({
  phone = SITE_CONFIG.contact.phone,
  logoUrl = null,
  companyName = SITE_CONFIG.name,
}: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const menuId = useId();
  const reduceMotion = useReducedMotion();
  const savedCount = useFavorites().length;

  const telHref = `tel:${phone.replace(/[^\d+]/g, "")}`;

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close the mobile menu on Escape — expected behaviour for a disclosure.
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen]);

  // Close mobile menu when route changes (adjust state during render).
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setIsOpen(false);
  }

  const isCurrent = (href: string) =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header
      className={cn(
        // A solid, blurred background at all times: transparent headers put
        // dark text over unpredictable page backgrounds.
        "fixed inset-x-0 top-0 z-50 bg-white/90 backdrop-blur-md transition-shadow duration-300",
        scrolled ? "shadow-sm" : "shadow-none"
      )}
    >
      <Container>
        <nav aria-label="Primary" className="flex items-center justify-between py-3 lg:py-4">
          <Logo logoUrl={logoUrl} name={companyName} />

          {/* Desktop Navigation */}
          <ul className="hidden items-center gap-7 lg:flex xl:gap-8">
            {NAV_LINKS.filter((link) => link.title !== "Favorites").map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  aria-current={isCurrent(link.href) ? "page" : undefined}
                  className={cn(
                    "text-sm font-medium transition-colors hover:text-primary",
                    isCurrent(link.href) ? "text-primary" : "text-dark"
                  )}
                >
                  {link.title}
                </Link>
              </li>
            ))}
          </ul>

          <div className="hidden items-center gap-3 lg:flex">
            <ThemeToggle />
            <Link
              href="/favorites"
              aria-current={isCurrent("/favorites") ? "page" : undefined}
              className={cn(
                "relative rounded-full p-2.5 transition-colors hover:bg-primary/10",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
                isCurrent("/favorites") || savedCount > 0 ? "text-primary" : "text-dark"
              )}
            >
              <Heart
                className={cn(
                  "h-5 w-5",
                  (isCurrent("/favorites") || savedCount > 0) && "fill-primary"
                )}
                aria-hidden="true"
              />
              {savedCount > 0 && (
                <span
                  className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[11px] font-bold leading-none text-white"
                  aria-hidden="true"
                >
                  {savedCount > 99 ? "99+" : savedCount}
                </span>
              )}
              <span className="sr-only">
                Saved properties
                {savedCount > 0 ? ` (${savedCount} saved)` : ""}
              </span>
            </Link>
            <a
              href={telHref}
              className="hidden items-center gap-2 text-sm font-semibold text-dark transition-colors hover:text-primary xl:flex"
            >
              <Phone className="h-4 w-4 text-primary" aria-hidden="true" />
              <span className="sr-only">Call us on </span>
              {phone}
            </a>
            {/* The single primary call to action, repeated site-wide. */}
            <Link
              href={PRIMARY_CTA.href}
              className={buttonClasses({ size: "sm", className: "font-semibold" })}
            >
              {PRIMARY_CTA.shortLabel}
            </Link>
          </div>

          {/* Mobile Toggle — 44px target, per WCAG 2.5.8 */}
          <button
            type="button"
            className="-mr-2 flex h-11 w-11 items-center justify-center rounded-md text-dark transition-colors hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary lg:hidden"
            onClick={() => setIsOpen((open) => !open)}
            aria-expanded={isOpen}
            aria-controls={menuId}
            aria-label={isOpen ? "Close menu" : "Open menu"}
          >
            {isOpen ? (
              <X className="h-6 w-6" aria-hidden="true" />
            ) : (
              <Menu className="h-6 w-6" aria-hidden="true" />
            )}
          </button>
        </nav>
      </Container>

      {/* Mobile Navigation */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            id={menuId}
            initial={reduceMotion ? false : { opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-gray-100 bg-white lg:hidden"
          >
            <Container className="flex max-h-[calc(100dvh-5rem)] flex-col gap-6 overflow-y-auto py-6">
              <ul className="flex flex-col">
                {NAV_LINKS.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      aria-current={isCurrent(link.href) ? "page" : undefined}
                      className={cn(
                        "flex items-center gap-2 py-3 text-lg font-semibold transition-colors",
                        isCurrent(link.href) ? "text-primary" : "text-dark"
                      )}
                    >
                      {link.title}
                      {link.href === "/favorites" && savedCount > 0 && (
                        <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-bold text-white">
                          <span className="sr-only">, </span>
                          {savedCount > 99 ? "99+" : savedCount}
                          <span className="sr-only"> saved</span>
                        </span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>

              <div className="border-t border-gray-100 pt-6">
                <ThemeToggle showLabel />
              </div>

              <div className="flex flex-col gap-4">
                <a
                  href={telHref}
                  className="flex items-center gap-3 py-2 text-lg font-semibold text-dark"
                >
                  <Phone className="h-5 w-5 text-primary" aria-hidden="true" />
                  <span className="sr-only">Call us on </span>
                  {phone}
                </a>
                <Link
                  href={PRIMARY_CTA.href}
                  className={buttonClasses({ className: "w-full py-3 font-bold" })}
                >
                  {PRIMARY_CTA.label}
                </Link>
              </div>
            </Container>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
