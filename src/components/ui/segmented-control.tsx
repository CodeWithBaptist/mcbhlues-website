"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export interface SegmentOption {
  label: string;
  value: string;
}

interface SegmentedControlProps {
  options: readonly SegmentOption[];
  value: string;
  onChange: (value: string) => void;
  /** Accessible name for the group — required, since the control has no visible label. */
  label: string;
  size?: "sm" | "md";
  className?: string;
  /** Let the track scroll horizontally instead of squeezing the labels. */
  scrollable?: boolean;
}

/**
 * Pill-style single-choice filter (All / For sale / For rent / …).
 *
 * Semantics: a real `radiogroup` with roving tabindex and arrow-key movement,
 * so it behaves like the native control it replaces rather than a row of
 * unrelated buttons. The highlight is a single absolutely-positioned chip that
 * slides between segments — measured from the DOM, so labels of any length work.
 */
export function SegmentedControl({
  options,
  value,
  onChange,
  label,
  size = "sm",
  className,
  scrollable = false,
}: SegmentedControlProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const optionRefs = useRef(new Map<string, HTMLButtonElement>());
  const [highlight, setHighlight] = useState<{ offset: number; width: number } | null>(null);

  // Measure after paint (not `useLayoutEffect`, which warns during SSR) and
  // re-measure whenever the layout changes — resizing, wrapping, new labels.
  useEffect(() => {
    const track = trackRef.current;
    const selected = optionRefs.current.get(value);
    if (!track || !selected) return;

    const measure = () => {
      const trackRect = track.getBoundingClientRect();
      const rect = selected.getBoundingClientRect();
      setHighlight({
        offset: rect.left - trackRect.left - 4, // the track's 4px padding
        width: rect.width,
      });
    };

    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(track);
    optionRefs.current.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [value, options]);

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    const index = options.findIndex((option) => option.value === value);
    if (index === -1) return;

    const last = options.length - 1;
    let next: SegmentOption | undefined;

    if (event.key === "ArrowRight" || event.key === "ArrowDown") next = options[index === last ? 0 : index + 1];
    else if (event.key === "ArrowLeft" || event.key === "ArrowUp") next = options[index === 0 ? last : index - 1];
    else if (event.key === "Home") next = options[0];
    else if (event.key === "End") next = options[last];

    if (!next) return;
    event.preventDefault();
    onChange(next.value);
    optionRefs.current.get(next.value)?.focus();
  }

  return (
    <div
      ref={trackRef}
      role="radiogroup"
      aria-label={label}
      onKeyDown={handleKeyDown}
      className={cn(
        "relative flex items-center gap-0.5 rounded-lg bg-gray-100 p-1",
        scrollable && "portal-table-scroll overflow-x-auto",
        className
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute inset-y-1 left-1 rounded-md bg-white shadow-sm",
          "transition-[transform,width] duration-300 ease-soft",
          highlight ? "opacity-100" : "opacity-0"
        )}
        style={
          highlight
            ? { width: highlight.width, transform: `translateX(${highlight.offset}px)` }
            : undefined
        }
      />

      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            ref={(node) => {
              if (node) optionRefs.current.set(option.value, node);
              else optionRefs.current.delete(option.value);
            }}
            type="button"
            role="radio"
            aria-checked={selected}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(option.value)}
            className={cn(
              "segmented-pill relative z-[1] whitespace-nowrap rounded-md font-semibold",
              size === "sm" ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm",
              !scrollable && "flex-1",
              selected ? "text-primary" : "text-gray-500 hover:text-dark",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
