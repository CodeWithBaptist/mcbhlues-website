"use client";

import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

const SHOW_AFTER = 420;
const CIRCUMFERENCE = 2 * Math.PI * 20; // r=20

export function BackToTop() {
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    let ticking = false;

    const update = () => {
      const y = window.scrollY;
      const doc = document.documentElement;
      const max = doc.scrollHeight - doc.clientHeight;
      const p = max > 0 ? Math.min(y / max, 1) : 0;
      setProgress(p);
      setVisible(y > SHOW_AFTER);
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
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: reduceMotion ? "auto" : "smooth",
    });
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          type="button"
          onClick={scrollToTop}
          aria-label="Back to top"
          title="Back to top"
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.96 }}
          animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
          exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 10, scale: 0.96 }}
          transition={
            reduceMotion
              ? { duration: 0.15 }
              : { type: "spring", stiffness: 340, damping: 26, mass: 0.7 }
          }
          className="group fixed bottom-6 right-4 z-40 flex h-[52px] w-[52px] items-center justify-center rounded-full bg-primary text-white shadow-[0_8px_24px_-12px_rgba(37,99,235,0.65),0_4px_12px_rgba(15,23,42,0.12)] ring-1 ring-primary/20 transition-colors hover:bg-primary-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:bottom-7 sm:right-7 sm:h-12 sm:w-12"
        >
          {/* progress ring */}
          <svg
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 h-full w-full -rotate-90"
            viewBox="0 0 44 44"
          >
            <circle
              cx="22"
              cy="22"
              r="20"
              fill="none"
              stroke="white"
              strokeOpacity="0.18"
              strokeWidth="2"
            />
            <circle
              cx="22"
              cy="22"
              r="20"
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={CIRCUMFERENCE * (1 - progress)}
              opacity={progress > 0.02 ? 1 : 0}
              style={{
                transition: reduceMotion ? "none" : "stroke-dashoffset 0.16s linear, opacity 0.2s ease",
              }}
            />
          </svg>

          <span className="relative flex h-9 w-9 items-center justify-center rounded-full bg-white/15 ring-1 ring-white/20 backdrop-blur-sm transition-transform duration-300 ease-soft group-hover:scale-105 group-active:scale-95">
            <ArrowUp className="h-4.5 w-4.5 h-[18px] w-[18px] transition-transform duration-300 ease-soft group-hover:-translate-y-0.5" />
          </span>

          <span className="sr-only">Back to top — {Math.round(progress * 100)}% scrolled</span>
        </motion.button>
      )}
    </AnimatePresence>
  );
}
