"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

/**
 * Eases a below-fold section in the first time it scrolls into view.
 *
 * Deliberately class-driven rather than state-driven: the hidden state is
 * only ever added by JS after mount, so server HTML, no-JS readers and
 * `prefers-reduced-motion` all see the content with no flash and no animation.
 * Only use this below the fold — above-fold content is covered by the page
 * entrance instead.
 */
export function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  /** Stagger offset in ms when several reveals stack on one page. */
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (typeof IntersectionObserver === "undefined") return;
    if (
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }
    node.classList.add("portal-reveal");
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          node.classList.add("is-visible");
          observer.disconnect();
        }
      },
      { threshold: 0.06, rootMargin: "0px 0px -4% 0px" }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
      className={cn(className)}
    >
      {children}
    </div>
  );
}
