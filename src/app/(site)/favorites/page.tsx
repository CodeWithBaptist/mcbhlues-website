import { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { FavoritesList } from "@/components/sections/favorites/favorites-list";

export const metadata: Metadata = {
  title: "My Favorites",
  description: "View your saved luxury properties and dream homes with MCBHLUES ENTERPRISES.",
};

export default function FavoritesPage() {
  return (
    <div className="flex flex-col pt-10">
      <FavoritesList />
    </div>
  );
}
