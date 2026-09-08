"use client";

import { useState } from "react";
import { Container } from "@/components/ui/container";
import { Image as ImageIcon } from "lucide-react";
import { SmartImage } from "@/components/ui/smart-image";
import { cn } from "@/lib/utils";

interface PropertyGalleryProps {
  images: string[];
  title: string;
}

export function PropertyGallery({ images, title }: PropertyGalleryProps) {
  const [active, setActive] = useState(0);

  if (images.length === 0) {
    return (
      <section className="bg-white py-12" aria-label="Property photos">
        <Container>
          <div className="flex h-[300px] items-center justify-center rounded-xl border border-gray-200 bg-gray-50 md:h-[480px]">
            <div className="text-center text-gray-600">
              <ImageIcon className="mx-auto mb-4 h-10 w-10 text-gray-400" aria-hidden="true" />
              <p className="font-semibold">No photos uploaded yet</p>
            </div>
          </div>
        </Container>
      </section>
    );
  }

  const activeIndex = Math.min(active, images.length - 1);

  return (
    <section className="bg-white py-8 sm:py-12" aria-label={`Photos of ${title}`}>
      <Container>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4 md:gap-4">
          <figure className="group relative m-0 h-[260px] overflow-hidden rounded-xl bg-gray-100 sm:h-[380px] md:col-span-2 md:row-span-2 md:h-[600px]">
            {/* Re-keyed on the index so each photo fades in rather than snapping. */}
            <SmartImage
              key={images[activeIndex]}
              src={images[activeIndex]}
              alt={`${title} — photo ${activeIndex + 1} of ${images.length}`}
              fill
              priority
              sizes="(min-width: 768px) 50vw, 100vw"
              className="animate-fade-in h-full w-full object-cover"
            />
            <figcaption className="pointer-events-none absolute bottom-3 left-3 rounded-md bg-black/55 px-2.5 py-1 text-xs font-semibold text-white">
              <span aria-live="polite">
                {activeIndex + 1} / {images.length}
              </span>
            </figcaption>
          </figure>

          {images.map((image, index) => {
            const selected = activeIndex === index;
            return (
              <button
                key={`${image}-${index}`}
                type="button"
                onClick={() => setActive(index)}
                aria-pressed={selected}
                className={cn(
                  "group relative h-28 overflow-hidden rounded-xl border bg-gray-100 transition-[opacity,border-color] duration-200 ease-soft sm:h-40 md:h-[290px]",
                  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
                  selected ? "border-primary ring-2 ring-primary" : "border-gray-200 opacity-75 hover:opacity-100"
                )}
              >
                <SmartImage
                  src={image}
                  alt=""
                  fill
                  sizes="(min-width: 768px) 25vw, 50vw"
                  className="h-full w-full object-cover transition-transform duration-500 ease-soft group-hover:scale-[1.03]"
                />
                <span className="sr-only">
                  Show photo {index + 1} of {images.length}
                </span>
              </button>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
