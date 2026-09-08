"use client";

import { useState } from "react";
import { ImageOff } from "lucide-react";
import { SmartImage } from "@/components/ui/smart-image";

/**
 * Public image renderer and 4:3 crop, with an honest unavailable-image state.
 * The photo eases to a slight zoom while its row is hovered — a pure transform
 * inside an overflow-hidden frame, so the layout never shifts.
 */
export function PropertyThumbnail({ src, alt }: { src?: string; alt: string }) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  if (!src || src === failedSrc) {
    return <span className="flex h-full w-full flex-col items-center justify-center gap-1 px-2 text-center text-gray-500" role="img" aria-label={`${alt} — image unavailable`}>
      <ImageOff className="h-5 w-5" aria-hidden="true" />
      <span className="text-[10px]">Image unavailable</span>
    </span>;
  }
  return <SmartImage src={src} alt={alt} width={192} height={144} sizes="96px"
    className="h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.06]" onError={() => setFailedSrc(src)} />;
}
