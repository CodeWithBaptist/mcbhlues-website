import { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { FavoritesList } from "@/components/sections/favorites/favorites-list";
import { listPublishedProperties } from "@/lib/properties/property-service";
import { toPublicProperty } from "@/lib/properties/public-property";
import { pageMetadata } from "@/lib/seo";

export const revalidate = 60; // seconds — keep in sync with docs (see src/lib/cache.ts)

export const metadata: Metadata = pageMetadata({
  title: "My Saved Properties",
  description:
    "The listings you have saved. Stored in your own browser — nothing is sent to us until you enquire.",
  path: "/favorites",
  // Per-visitor state held in localStorage: nothing here is worth indexing,
  // and the crawler would only ever see an empty list.
  robots: { index: false, follow: true },
});

export default async function FavoritesPage() {
  const properties = (await listPublishedProperties()).map(toPublicProperty);

  return (
    <div className="flex flex-col">
      {/* Server-rendered heading so the page has a stable h1 regardless of
          what the client-side list resolves to. */}
      <section className="border-b border-gray-200 bg-background-soft py-12 sm:py-16">
        <Container>
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-primary">Saved listings</p>
          <h1 className="font-heading text-3xl font-bold tracking-tight text-dark sm:text-4xl">
            Your saved properties
          </h1>
          <p className="mt-3 max-w-xl text-gray-600">
            Kept in this browser only — nothing is sent to us until you enquire.
          </p>
        </Container>
      </section>
      <FavoritesList properties={properties} />
    </div>
  );
}
