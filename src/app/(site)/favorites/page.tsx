import { Metadata } from "next";
import { FavoritesList } from "@/components/sections/favorites/favorites-list";
import { listPublishedProperties } from "@/lib/properties/property-service";
import { toPublicProperty } from "@/lib/properties/public-property";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "My Favorites",
  description: "View your saved luxury properties and dream homes with MCBHLUES ENTERPRISES.",
};

export default async function FavoritesPage() {
  const properties = (await listPublishedProperties()).map(toPublicProperty);

  return (
    <div className="flex flex-col pt-10">
      <FavoritesList properties={properties} />
    </div>
  );
}
