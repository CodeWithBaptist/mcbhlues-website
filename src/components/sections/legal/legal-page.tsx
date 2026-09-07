import Link from "next/link";
import { Container } from "@/components/ui/container";

/**
 * Shared chrome for the legal pages (Privacy Policy, Terms & Conditions).
 * Server components — no client JavaScript is shipped for a page of text.
 */

export function LegalHero({
  eyebrow,
  title,
  summary,
  lastUpdated,
}: {
  eyebrow: string;
  title: string;
  summary: string;
  lastUpdated: string;
}) {
  return (
    <section className="relative overflow-hidden bg-dark py-16 text-white sm:py-20">
      <div className="absolute inset-0 opacity-10" aria-hidden="true">
        <div className="absolute inset-0 bg-[radial-gradient(#2563EB_1px,transparent_1px)] [background-size:40px_40px]" />
      </div>
      <Container className="relative z-10">
        <p className="mb-4 text-sm font-bold uppercase tracking-widest text-primary-light">
          {eyebrow}
        </p>
        <h1 className="font-heading text-3xl font-extrabold leading-tight sm:text-4xl md:text-5xl">
          {title}
        </h1>
        <p className="mt-6 max-w-2xl text-base leading-relaxed text-gray-200 sm:text-lg">
          {summary}
        </p>
        <p className="mt-6 text-sm text-gray-300">
          Last updated: <time dateTime={lastUpdated}>{formatDate(lastUpdated)}</time>
        </p>
      </Container>
    </section>
  );
}

function formatDate(iso: string) {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function LegalLayout({
  toc,
  children,
}: {
  toc: { id: string; title: string }[];
  children: React.ReactNode;
}) {
  return (
    <Container className="py-14 sm:py-20">
      <div className="grid gap-12 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-16">
        <nav aria-label="On this page" className="lg:sticky lg:top-28 lg:self-start">
          <h2 className="mb-4 text-xs font-bold uppercase tracking-widest text-gray-600">
            On this page
          </h2>
          <ol className="space-y-2 border-l border-gray-200 pl-4 text-sm">
            {toc.map((item, index) => (
              <li key={item.id}>
                <a
                  href={`#${item.id}`}
                  className="text-gray-600 underline-offset-4 transition-colors hover:text-primary hover:underline"
                >
                  <span className="mr-1 tabular-nums text-gray-600">{index + 1}.</span>
                  {item.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="max-w-3xl">{children}</div>
      </div>
    </Container>
  );
}

export function LegalSection({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="mb-12 scroll-mt-28">
      <h2 className="mb-4 font-heading text-2xl font-bold text-dark">{title}</h2>
      <div className="space-y-4 text-base leading-relaxed text-gray-700">{children}</div>
    </section>
  );
}

/** Bulleted list with consistent spacing. */
export function LegalList({ items }: { items: React.ReactNode[] }) {
  return (
    <ul className="ml-5 list-disc space-y-2 marker:text-primary">
      {items.map((item, index) => (
        <li key={index}>{item}</li>
      ))}
    </ul>
  );
}

/**
 * Highlights a value the business must supply before publishing. Rendered
 * visibly on purpose — a silent placeholder is a placeholder that ships.
 */
export function Placeholder({ children }: { children: React.ReactNode }) {
  return (
    <mark className="rounded bg-amber-100 px-1.5 py-0.5 font-semibold text-amber-950">
      <span className="sr-only">Information still to be confirmed: </span>[{children}]
    </mark>
  );
}

export function LegalFooterNote() {
  return (
    <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6">
      <h2 className="mb-2 font-heading text-lg font-bold text-dark">Questions?</h2>
      <p className="text-base leading-relaxed text-gray-700">
        If anything on this page is unclear, please{" "}
        <Link
          href="/contact"
          className="font-semibold text-primary underline underline-offset-2 hover:text-primary-dark"
        >
          get in touch
        </Link>{" "}
        and we will explain it in plain language.
      </p>
    </div>
  );
}
