"use client";

import { useState } from "react";
import { MapPin, Navigation, Map as MapIcon, Car } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SITE_CONFIG } from "@/constants";
import { cn } from "@/lib/utils";

interface PropertyMapProps {
  location: string;
  latitude?: string;
  longitude?: string;
  /** Default "directions from" address — the office address from Company Settings. */
  defaultOrigin?: string;
}

export function PropertyMap({
  location,
  latitude,
  longitude,
  defaultOrigin = SITE_CONFIG.contact.address,
}: PropertyMapProps) {
  const [view, setView] = useState<"map" | "directions">("map");
  const [origin, setOrigin] = useState(defaultOrigin);
  const [activeOrigin, setActiveOrigin] = useState(defaultOrigin);

  // Prefer an exact coordinate pin when the listing has one; otherwise fall
  // back to a text query of the location.
  const hasCoords = Boolean(latitude && longitude);
  const mapQuery = hasCoords
    ? `${Number(latitude).toFixed(6)},${Number(longitude).toFixed(6)}`
    : encodeURIComponent(location);

  // Keyless Google Maps embeds — work inside iframes WITHOUT an API key
  // and WITHOUT opening any new tabs/popups (which sandboxed previews block).
  const mapEmbedUrl = `https://maps.google.com/maps?q=${mapQuery}&t=m&z=14&ie=UTF8&iwloc=B&output=embed`;
  const directionsEmbedUrl = `https://maps.google.com/maps?saddr=${encodeURIComponent(
    activeOrigin
  )}&daddr=${mapQuery}&output=embed`;

  const handleShowRoute = () => {
    setActiveOrigin(origin.trim() || defaultOrigin);
    setView("directions");
  };

  return (
    <section className="py-12 border-t border-gray-100">
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h3 className="text-2xl font-bold text-dark font-heading mb-2">
              Location & Neighborhood
            </h3>
            <div className="flex items-center gap-2 text-gray-500">
              <MapPin className="w-4 h-4 text-primary" />
              <span>{location}</span>
            </div>
          </div>

          {/* View toggle — stays inline, never opens a new tab */}
          <div className="flex p-1 bg-gray-100 rounded-xl">
            <button
              onClick={() => setView("map")}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-all cursor-pointer",
                view === "map"
                  ? "bg-white text-primary shadow-sm"
                  : "text-gray-500 hover:text-dark"
              )}
            >
              <MapIcon className="w-4 h-4" />
              Property Map
            </button>
            <button
              onClick={() => setView("directions")}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-all cursor-pointer",
                view === "directions"
                  ? "bg-white text-primary shadow-sm"
                  : "text-gray-500 hover:text-dark"
              )}
            >
              <Navigation className="w-4 h-4" />
              Directions
            </button>
          </div>
        </div>

        {/* Directions origin input (only shown in directions view) */}
        {view === "directions" && (
          <div className="flex flex-col sm:flex-row gap-3 p-4 bg-background-soft rounded-xl border border-primary/10">
            <div className="flex items-center gap-3 flex-1">
              <Car className="w-5 h-5 text-primary shrink-0" />
              <Input
                placeholder="Enter your starting address..."
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                className="bg-white"
              />
            </div>
            <Button onClick={handleShowRoute} className="shrink-0">
              Show Route
            </Button>
          </div>
        )}

        {/* Inline iframe — map or directions, both render inside the page */}
        <div className="relative w-full h-[420px] rounded-2xl overflow-hidden border border-gray-200 bg-gray-100 shadow-inner">
          <iframe
            key={view === "directions" ? directionsEmbedUrl : mapEmbedUrl}
            width="100%"
            height="100%"
            frameBorder="0"
            style={{ border: 0 }}
            src={view === "directions" ? directionsEmbedUrl : mapEmbedUrl}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title={
              view === "directions"
                ? `Directions to ${location}`
                : `Map of ${location}`
            }
          />
        </div>

        {/* Neighborhood stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Walk Score", value: "92/100" },
            { label: "Transit Score", value: "88/100" },
            { label: "Nearest Airport", value: "15 mins" },
            { label: "City Center", value: "5 mins" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="p-4 rounded-xl bg-background-soft border border-primary/5"
            >
              <p className="text-[10px] uppercase tracking-widest font-bold text-primary mb-1">
                {stat.label}
              </p>
              <p className="text-lg font-bold text-dark">{stat.value}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
