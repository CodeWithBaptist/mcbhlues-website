import { Metadata } from "next";
import { FavoritesList } from "@/components/sections/favorites/favorites-list";
import { listPublishedProperties } from "@/lib/properties/property-service";
import { toPublicProperty } from "@/lib/properties/public-property";
import { pageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

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
    <div className="flex flex-col pt-10">
      <FavoritesList properties={properties} />
    </div>
  );
}
