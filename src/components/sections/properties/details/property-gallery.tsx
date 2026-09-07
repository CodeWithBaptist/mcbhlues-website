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
          <div className="relative h-[260px] overflow-hidden rounded-2xl bg-gray-100 sm:h-[380px] md:col-span-2 md:row-span-2 md:h-[600px]">
            <SmartImage
              src={images[activeIndex]}
              alt={`${title} — photo ${activeIndex + 1} of ${images.length}`}
              fill
              priority
              sizes="(min-width: 768px) 50vw, 100vw"
              className="h-full w-full object-cover"
            />
          </div>

          {images.map((image, index) => (
            <button
              key={`${image}-${index}`}
              type="button"
              onClick={() => setActive(index)}
              aria-pressed={activeIndex === index}
              className={cn(
                "relative h-28 overflow-hidden rounded-2xl border bg-gray-100 transition-all sm:h-40 md:h-[290px]",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
                activeIndex === index
                  ? "border-primary ring-2 ring-primary"
                  : "border-gray-200 opacity-80 hover:opacity-100"
              )}
            >
              <SmartImage
                src={image}
                alt=""
                fill
                sizes="(min-width: 768px) 25vw, 50vw"
                className="h-full w-full object-cover"
              />
              <span className="sr-only">
                Show photo {index + 1} of {images.length}
              </span>
            </button>
          ))}
        </div>
      </Container>
    </section>
  );
}
