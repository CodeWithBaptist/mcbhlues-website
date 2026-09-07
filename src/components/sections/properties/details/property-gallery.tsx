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
          <div className="flex h-[300px] items-center justify-center rounded-2xl border border-gray-200 bg-gray-50 md:h-[600px]">
            <div className="text-center text-gray-600">
              <ImageIcon className="mx-auto mb-4 h-16 w-16" aria-hidden="true" />
              <p className="font-bold">No photos uploaded yet</p>
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
          <figure className="group relative m-0 h-[260px] overflow-hidden rounded-2xl bg-gray-100 sm:h-[380px] md:col-span-2 md:row-span-2 md:h-[600px]">
            {/* Re-keyed on the index so each photo fades in rather than snapping. */}
            <SmartImage
              key={images[activeIndex]}
              src={images[activeIndex]}
              alt={`${title} — photo ${activeIndex + 1} of ${images.length}`}
              fill
              priority
              sizes="(min-width: 768px) 50vw, 100vw"
              className="animate-fade-in h-full w-full object-cover transition-transform duration-700 ease-soft group-hover:scale-[1.02]"
            />
            <figcaption className="pointer-events-none absolute bottom-3 left-3 rounded-full bg-black/55 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
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
                  "group relative h-28 overflow-hidden rounded-2xl border bg-gray-100 transition-all duration-300 ease-soft sm:h-40 md:h-[290px]",
                  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
                  selected
                    ? "border-primary ring-2 ring-primary"
                    : "border-gray-200 opacity-80 hover:-translate-y-0.5 hover:opacity-100 hover:shadow-md"
                )}
              >
                <SmartImage
                  src={image}
                  alt=""
                  fill
                  sizes="(min-width: 768px) 25vw, 50vw"
                  className="h-full w-full object-cover transition-transform duration-500 ease-soft group-hover:scale-105"
                />
                {!selected && (
                  <span
                    aria-hidden="true"
                    className="absolute inset-0 bg-primary-dark/0 transition-colors duration-300 group-hover:bg-primary-dark/10"
                  />
                )}
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
