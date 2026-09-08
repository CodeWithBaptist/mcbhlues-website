"use client";

import { MotionConfig } from "framer-motion";

/**
 * One place where Framer Motion learns about `prefers-reduced-motion`.
 *
 * With `reducedMotion="user"` every `motion.*` element beneath this boundary
 * drops its transform animations (slides, scales) and keeps only opacity when
 * the visitor has asked for less motion — so individual sections do not each
 * need their own `useReducedMotion` branch. The default transition is the
 * site-wide ease-out curve so entrances feel the same everywhere.
 */
export function SiteMotion({ children }: { children: React.ReactNode }) {
  return (
    <MotionConfig reducedMotion="user" transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}>
      {children}
    </MotionConfig>
  );
}
