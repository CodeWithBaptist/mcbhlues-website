"use client";

import { motion, useScroll, useSpring } from "framer-motion";

/**
 * Hairline reading-progress bar pinned to the very top of the viewport.
 *
 * Purely decorative (aria-hidden) and transform-only: `useSpring` smooths the
 * raw scroll value and the browser composites `scaleX` on the GPU, so long
 * property pages scroll without jank.
 *
 * Hidden with the `motion-reduce:` variant rather than by returning `null` —
 * the server cannot know the visitor's motion preference, and bailing out
 * client-side would produce a hydration mismatch.
 */
export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 140,
    damping: 24,
    restDelta: 0.001,
  });

  return (
    <motion.div
      aria-hidden="true"
      className="motion-reduce:hidden fixed inset-x-0 top-0 z-[60] h-0.5 origin-left bg-primary"
      style={{ scaleX }}
    />
  );
}
