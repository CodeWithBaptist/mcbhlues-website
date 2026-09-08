import Link from "next/link";
import { ArrowRight, Home, Search, Phone } from "lucide-react";
import { Container } from "@/components/ui/container";
import { buttonClasses } from "@/components/ui/button";
import { PRIMARY_CTA, SITE_CONFIG } from "@/constants";

const SUGGESTIONS = [
  {
    href: "/properties",
    icon: Search,
    title: "Browse all properties",
    description: "Every listing we currently have for sale or to rent.",
  },
  {
    href: "/about",
    icon: Home,
    title: "How we work",
    description: "Consulting, development and facility management explained.",
  },
  {
    href: "/contact",
    icon: Phone,
    title: "Talk to a consultant",
    description: "Tell us what you are looking for and we will find it.",
  },
];

/**
 * Body of the 404 page. Shared by the root `not-found.tsx` (unmatched URLs) and
 * the `(site)` one (a `notFound()` thrown by, say, a deleted listing) so both
 * look identical.
 */
export function NotFoundContent() {
  return (
    <section className="py-16 sm:py-24">
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-primary">
            Error 404
          </p>
          <h1 className="font-heading text-3xl font-bold tracking-tight text-dark sm:text-5xl">
            We couldn&rsquo;t find that page
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-gray-600 sm:text-lg">
            The link may be out of date, or the listing it pointed to has been
            sold, let or withdrawn. Nothing is lost — here is where to go next.
          </p>

          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href={PRIMARY_CTA.href}
              className={buttonClasses({
                size: "lg",
                className: "w-full gap-2 font-semibold sm:w-auto",
              })}
            >
              {PRIMARY_CTA.label}
              <ArrowRight className="h-5 w-5" aria-hidden="true" />
            </Link>
            <Link
              href="/"
              className="text-base font-semibold text-primary underline-offset-4 hover:underline"
            >
              Back to the homepage
            </Link>
          </div>
        </div>

        <div className="mx-auto mt-16 grid max-w-4xl gap-4 sm:grid-cols-3">
          {SUGGESTIONS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-6 text-left transition-[border-color,box-shadow] duration-200 hover:border-gray-300 hover:shadow-soft"
            >
              <item.icon className="h-6 w-6 text-primary" aria-hidden="true" />
              <span className="font-heading text-lg font-bold text-dark group-hover:text-primary">
                {item.title}
              </span>
              <span className="text-sm leading-relaxed text-gray-600">
                {item.description}
              </span>
            </Link>
          ))}
        </div>

        <p className="mt-12 text-center text-sm text-gray-600">
          Still stuck? Call us on{" "}
          <a
            href={`tel:${SITE_CONFIG.contact.phone.replace(/\s+/g, "")}`}
            className="font-semibold text-primary underline underline-offset-2 hover:text-primary-dark"
          >
            {SITE_CONFIG.contact.phone}
          </a>{" "}
          or email{" "}
          <a
            href={`mailto:${SITE_CONFIG.contact.email}`}
            className="font-semibold text-primary underline underline-offset-2 hover:text-primary-dark"
          >
            {SITE_CONFIG.contact.email}
          </a>
          .
        </p>
      </Container>
    </section>
  );
}
