"use client";

import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

const SHOW_AFTER = 380;

export function PortalBackToTop() {
  const [visible, setVisible] = useState(false);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    let ticking = false;
    const update = () => {
      setVisible(window.scrollY > SHOW_AFTER);
      ticking = false;
    };
    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(update);
      }
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          type="button"
          onClick={scrollToTop}
          aria-label="Back to top"
          title="Back to top"
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.96 }}
          animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
          exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.96 }}
          transition={reduceMotion ? { duration: 0.12 } : { type: "spring", stiffness: 340, damping: 26 }}
          className="fixed bottom-5 right-4 z-30 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-primary shadow-[0_8px_24px_-12px_rgba(15,23,42,0.22),0_4px_12px_rgba(15,23,42,0.08)] ring-1 ring-gray-200 transition-colors hover:bg-primary hover:text-white hover:ring-primary sm:bottom-6 sm:right-6"
        >
          <ArrowUp className="h-4 w-4" />
        </motion.button>
      )}
    </AnimatePresence>
  );
}
