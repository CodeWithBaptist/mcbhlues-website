"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Phone, Heart } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { NAV_LINKS, SITE_CONFIG } from "@/constants";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        scrolled
          ? "bg-white/80 backdrop-blur-md shadow-sm py-3"
          : "bg-transparent py-5"
      )}
    >
      <Container>
        <nav className="flex items-center justify-between">
          <Logo />

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-8">
            {NAV_LINKS.filter(link => link.title !== "Favorites").map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "text-sm font-medium transition-colors hover:text-primary",
                  pathname === link.href ? "text-primary" : "text-dark"
                )}
              >
                {link.title}
              </Link>
            ))}
          </div>

          <div className="hidden lg:flex items-center gap-6">
            <Link 
              href="/favorites" 
              className={cn(
                "relative p-2 rounded-full hover:bg-primary/5 transition-colors",
                pathname === "/favorites" ? "text-primary" : "text-dark"
              )}
            >
              <Heart className={cn("w-5 h-5", pathname === "/favorites" && "fill-primary")} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full border-2 border-white" />
            </Link>
            <a
              href={`tel:${SITE_CONFIG.contact.phone}`}
              className="flex items-center gap-2 text-sm font-semibold text-dark hover:text-primary transition-colors"
            >
              <Phone className="w-4 h-4 text-primary" />
              {SITE_CONFIG.contact.phone}
            </a>
            <Link href="/contact">
              <Button size="sm">Get a Quote</Button>
            </Link>
          </div>

          {/* Mobile Toggle */}
          <button
            className="lg:hidden text-dark p-2"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </nav>
      </Container>

      {/* Mobile Navigation */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-white border-t overflow-hidden"
          >
            <Container className="py-8 flex flex-col gap-6">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "text-lg font-semibold transition-colors",
                    pathname === link.href ? "text-primary" : "text-dark"
                  )}
                >
                  {link.title}
                </Link>
              ))}
              <hr />
              <div className="flex flex-col gap-4">
                <a
                  href={`tel:${SITE_CONFIG.contact.phone}`}
                  className="flex items-center gap-3 text-lg font-semibold text-dark"
                >
                  <Phone className="w-5 h-5 text-primary" />
                  {SITE_CONFIG.contact.phone}
                </a>
                <Link href="/contact" className="w-full">
                  <Button className="w-full">Get a Quote</Button>
                </Link>
              </div>
            </Container>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
