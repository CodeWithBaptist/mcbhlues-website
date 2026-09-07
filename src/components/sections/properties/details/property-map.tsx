"use client";

import { useState } from "react";
import { MapPin, Navigation, Map as MapIcon, Car } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface PropertyMapProps {
  location: string;
  /** Optional fuller search string (e.g. full address) for the text pin. */
  query?: string;
  latitude?: string;
  longitude?: string;
}

export function PropertyMap({ location, query, latitude, longitude }: PropertyMapProps) {
  const [view, setView] = useState<"map" | "directions">("map");
  const [origin, setOrigin] = useState("");
  const [activeOrigin, setActiveOrigin] = useState("");

  const hasCoords = Boolean(
    latitude &&
      longitude &&
      Number.isFinite(Number(latitude)) &&
      Number.isFinite(Number(longitude))
  );

  // A keyless Google Maps embed that works inside iframes without an API key.
  // Prefer an exact pin when coordinates are present, otherwise drop a pin on
  // the location text (full address if we have one, else the city label).
  const textQuery = (query || location || "Nigeria").trim();
  const mapQuery = hasCoords
    ? `${Number(latitude).toFixed(6)},${Number(longitude).toFixed(6)}`
    : encodeURIComponent(textQuery);
  const mapEmbedUrl = `https://maps.google.com/maps?q=${mapQuery}&t=m&z=13&ie=UTF8&iwloc=B&output=embed`;

  const handleShowRoute = () => {
    if (!origin.trim()) return;
    setActiveOrigin(origin.trim());
    setView("directions");
  };

  const directionsEmbedUrl = `https://maps.google.com/maps?saddr=${encodeURIComponent(
    activeOrigin
  )}&daddr=${mapQuery}&output=embed`;

  return (
    <section className="py-12 border-t border-gray-100">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h3 className="text-2xl font-bold text-dark font-heading mb-2">
              Location
            </h3>
            <div className="flex items-center gap-2 text-gray-500">
              <MapPin className="w-4 h-4 text-primary" />
              <span>{location || "Nigeria"}</span>
            </div>
          </div>

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
              Map
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
            title={view === "directions" ? `Directions to ${location || "the property"}` : `Map of ${location || "the property"}`}
          />
        </div>
      </div>
    </section>
  );
}
