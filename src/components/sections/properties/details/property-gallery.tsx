"use client";

import { useState } from "react";
import { Container } from "@/components/ui/container";
import { Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface PropertyGalleryProps {
  images: string[];
  title: string;
}

const FALLBACK_SLOTS = 4;

export function PropertyGallery({ images, title }: PropertyGalleryProps) {
  const [active, setActive] = useState(0);

  const gallery = images.length > 0 ? images : [];

  if (gallery.length === 0) {
    return (
      <section className="bg-white py-12">
        <Container>
          <div className="flex h-[400px] items-center justify-center rounded-2xl border border-gray-100 bg-gray-50 md:h-[600px]">
            <div className="text-center text-gray-300">
              <ImageIcon className="mx-auto mb-4 h-20 w-20" />
              <p className="font-bold">No photos uploaded yet</p>
            </div>
          </div>
        </Container>
      </section>
    );
  }

  const thumbnails = gallery.slice(0, Math.max(FALLBACK_SLOTS, gallery.length));

  return (
    <section className="bg-white py-12">
      <Container>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="relative h-[400px] overflow-hidden rounded-2xl bg-gray-100 md:col-span-2 md:row-span-2 md:h-[600px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={gallery[active]}
              alt={`${title} photo ${active + 1}`}
              className="h-full w-full object-cover"
            />
          </div>
          {thumbnails.map((image, index) => (
            <button
              key={`${image}-${index}`}
              type="button"
              onClick={() => setActive(index)}
              className={cn(
                "h-40 overflow-hidden rounded-2xl border bg-gray-100 transition-all md:h-[290px]",
                active === index ? "ring-2 ring-primary" : "opacity-80 hover:opacity-100"
              )}
              aria-label={`View photo ${index + 1}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image}
                alt={`${title} photo ${index + 1}`}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </button>
          ))}
        </div>
      </Container>
    </section>
  );
}
