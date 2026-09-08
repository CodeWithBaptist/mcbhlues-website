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
            <h2 className="mb-2 font-heading text-xl font-bold text-dark sm:text-2xl">Location</h2>
            <div className="flex items-center gap-2 text-gray-600">
              <MapPin className="h-4 w-4 text-primary" aria-hidden="true" />
              <span>{location || "Nigeria"}</span>
            </div>
          </div>

          <div className="flex rounded-lg bg-gray-100 p-1" role="group" aria-label="Map view">
            <button
              type="button"
              onClick={() => setView("map")}
              aria-pressed={view === "map"}
              className={cn(
                "flex cursor-pointer items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition-colors duration-200",
                view === "map" ? "bg-white text-primary shadow-sm" : "text-gray-600 hover:text-dark"
              )}
            >
              <MapIcon className="h-4 w-4" aria-hidden="true" />
              Map
            </button>
            <button
              type="button"
              onClick={() => setView("directions")}
              aria-pressed={view === "directions"}
              className={cn(
                "flex cursor-pointer items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition-colors duration-200",
                view === "directions" ? "bg-white text-primary shadow-sm" : "text-gray-600 hover:text-dark"
              )}
            >
              <Navigation className="h-4 w-4" aria-hidden="true" />
              Directions
            </button>
          </div>
        </div>

        {view === "directions" && (
          <div className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-background-soft p-4 sm:flex-row">
            <div className="flex flex-1 items-center gap-3">
              <Car className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
              <Input
                placeholder="Enter your starting address..."
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                className="bg-white"
                aria-label="Starting address for directions"
              />
            </div>
            <Button onClick={handleShowRoute} className="shrink-0">
              Show Route
            </Button>
          </div>
        )}

        <div className="relative h-[420px] w-full overflow-hidden rounded-xl border border-gray-200 bg-gray-100">
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
