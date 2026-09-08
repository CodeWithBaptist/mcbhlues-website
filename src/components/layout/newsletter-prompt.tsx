"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, MapPin, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SmartImage } from "@/components/ui/smart-image";
import { CONSENT_EVENT, readConsent } from "@/lib/consent";
import {
  hasAnsweredNewsletterPrompt,
  recordNewsletterPrompt,
} from "@/lib/newsletter/prompt-store";
import { validateSubscriptionEmail } from "@/lib/newsletter/subscription";

/**
 * The newsletter prompt — a deliberately small, considered interruption.
 *
 * It is one screen of brand, not a takeover: a photograph from the portfolio,
 * a short promise, and a single field. It opens once per visitor, only after
 * they have actually read something (exit-intent on pointer devices, dwell on
 * touch), never on the contact page, and never again once they have answered.
 *
 * The success state is honest: it is shown only after the address is durably
 * stored by `/api/public/subscribe`, never as a client-side illusion.
 *
 * Motion runs through the site-wide `MotionConfig reducedMotion="user"`, so the
 * choreography collapses to opacity for anyone who asked for less of it.
 */

const EASE = [0.22, 1, 0.36, 1] as const;

const IMAGE_SRC = "/newsletter-property.jpg";
const IMAGE_ALT =
  "A contemporary MCBHLUES residence at dusk, glazing lit from within and reflected in a still courtyard pool";

type SubmitState = "idle" | "submitting" | "success";

function prefersFinePointer(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(pointer: fine)").matches
  );
}

export function NewsletterPrompt() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [alreadySubscribed, setAlreadySubscribed] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);

  const openedOnce = useRef(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  /** Ask the dialog to open, exactly once, and only if it should. */
  const trigger = useCallback(() => {
    if (openedOnce.current) return;
    openedOnce.current = true;

    // If the visitor hasn't answered the cookie banner yet, don't stack two
    // overlays — wait for that decision, then open.
    if (readConsent() === null) {
      const onDecided = () => setOpen(true);
      document.addEventListener(CONSENT_EVENT, onDecided, { once: true });
      return;
    }
    setOpen(true);
  }, []);

  // Arm the triggers. Runs once per mount; the prompt is a per-visit courtesy,
  // not a per-page ambush.
  useEffect(() => {
    // Dev-only preview: `?newsletter=preview` opens it immediately and ignores a
    // stored answer, so the design can be reviewed without waiting for exit
    // intent. Compiled out of production — `NODE_ENV` is inlined at build.
    const isPreview =
      process.env.NODE_ENV === "development" &&
      typeof window !== "undefined" &&
      new URLSearchParams(window.location.search).get("newsletter") === "preview";

    if (!isPreview && hasAnsweredNewsletterPrompt()) return;
    if (pathname.startsWith("/contact")) return;

    const timers: number[] = [];
    if (isPreview) timers.push(window.setTimeout(trigger, 500));

    if (prefersFinePointer()) {
      // Exit-intent on desktop, but only once the visitor has read a little.
      const ARM_AT_MS = 8_000;
      let armed = false;
      timers.push(window.setTimeout(() => (armed = true), ARM_AT_MS));
      const onLeave = (event: MouseEvent) => {
        if (!armed) return;
        if (event.relatedTarget || event.clientY > 0) return;
        trigger();
      };
      document.addEventListener("mouseout", onLeave);
      return () => {
        timers.forEach((t) => window.clearTimeout(t));
        document.removeEventListener("mouseout", onLeave);
      };
    }

    // Touch devices have no cursor to watch; dwell instead.
    timers.push(window.setTimeout(trigger, 30_000));
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [pathname, trigger]);

  const dismiss = useCallback(() => {
    setOpen(false);
    if (submitState !== "success") recordNewsletterPrompt("dismissed");
  }, [submitState]);

  // While open: lock scroll, focus the field, trap Tab, close on Escape,
  // and hand focus back when we close.
  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const previouslyFocused = document.activeElement as HTMLElement | null;

    const focusTimer = window.setTimeout(
      () => inputRef.current?.focus({ preventScroll: true }),
      320 // after the entrance settles
    );

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        dismiss();
        return;
      }
      if (event.key !== "Tab") return;
      const root = panelRef.current;
      if (!root) return;
      const controls = root.querySelectorAll<HTMLElement>(
        'a[href], button:not(:disabled), input:not(:disabled), [tabindex]:not([tabindex="-1"])'
      );
      const visible = Array.from(controls).filter((el) => el.getClientRects().length > 0);
      if (visible.length === 0) {
        event.preventDefault();
        return;
      }
      const first = visible[0];
      const last = visible[visible.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey);

    return () => {
      window.clearTimeout(focusTimer);
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
      previouslyFocused?.focus?.({ preventScroll: true });
    };
  }, [open, dismiss]);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    const validation = validateSubscriptionEmail(email);
    if (validation) {
      setError(validation);
      inputRef.current?.focus();
      return;
    }

    setSubmitState("submitting");
    setError(null);
    try {
      const response = await fetch("/api/public/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = (await response.json().catch(() => null)) as
        | { ok?: boolean; alreadySubscribed?: boolean; error?: string }
        | null;

      if (response.ok && data?.ok) {
        recordNewsletterPrompt("subscribed");
        setAlreadySubscribed(Boolean(data.alreadySubscribed));
        setSubmitState("success");
      } else {
        setSubmitState("idle");
        setError(data?.error ?? "We couldn't add that address just now. Please try again.");
        inputRef.current?.focus();
      }
    } catch {
      setSubmitState("idle");
      setError("Something went wrong on our side. Please try again in a moment.");
      inputRef.current?.focus();
    }
  }

  const stagger = (delay: number) => ({
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.45, ease: EASE, delay },
  });

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="backdrop"
          className="fixed inset-0 z-[80] flex items-center justify-center p-4 sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.22 } }}
          transition={{ duration: 0.3 }}
        >
          {/* Soft, blurred veil — the page reads behind, not in front. */}
          <div
            className="absolute inset-0 bg-[#0b1526]/45 backdrop-blur-md"
            onClick={dismiss}
            aria-hidden="true"
          />

          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="newsletter-title"
            className="relative w-full max-w-[26.5rem] overflow-hidden rounded-xl bg-white shadow-lift sm:max-w-[40rem]"
            initial={{ opacity: 0, y: 22, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.99, transition: { duration: 0.22 } }}
            transition={{ duration: 0.5, ease: EASE }}
          >
            <div className="sm:grid sm:grid-cols-[16.5rem_1fr]">
              {/* ------------------------------------------------ photograph */}
              <div className="relative h-40 overflow-hidden bg-primary-dark sm:h-full">
                {!imageFailed && (
                  <motion.div
                    className="absolute inset-0"
                    initial={{ scale: 1.07 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 1.6, ease: EASE }}
                  >
                    <SmartImage
                      src={IMAGE_SRC}
                      alt={IMAGE_ALT}
                      fill
                      sizes="(min-width: 640px) 264px, 100vw"
                      className="object-cover object-[70%_center]"
                      onError={() => setImageFailed(true)}
                    />
                  </motion.div>
                )}
                {/* Brand duotone keeps the photo inside the palette. */}
                <div
                  className="absolute inset-0 bg-gradient-to-t from-primary-dark/70 via-primary-dark/10 to-transparent"
                  aria-hidden="true"
                />
                <div className="absolute inset-x-0 bottom-0 flex items-center gap-1.5 p-4">
                  <MapPin className="h-3.5 w-3.5 text-primary-light" aria-hidden="true" />
                  <span className="text-[0.6875rem] font-semibold uppercase tracking-[0.18em] text-white/90">
                    Victoria Island · Lagos
                  </span>
                </div>
              </div>

              {/* ------------------------------------------------ content */}
              <div className="relative p-7 sm:p-10">
                {/* Minimal close. */}
                <button
                  type="button"
                  onClick={dismiss}
                  aria-label="Close newsletter sign-up"
                  className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition-colors duration-200 hover:bg-gray-100 hover:text-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>

                {submitState === "success" ? (
                  <div className="flex min-h-[22rem] flex-col items-start justify-center gap-5 sm:min-h-[20rem]">
                    <motion.span
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.4, ease: EASE }}
                      className="flex h-12 w-12 items-center justify-center rounded-full border border-primary/25 bg-primary-soft text-primary"
                    >
                      {/* Drawn check, not a static glyph. */}
                      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" aria-hidden="true">
                        <motion.path
                          d="M5 12.5l4.5 4.5L19 7.5"
                          stroke="currentColor"
                          strokeWidth="2.2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          initial={{ pathLength: 0 }}
                          animate={{ pathLength: 1 }}
                          transition={{ duration: 0.45, ease: EASE, delay: 0.15 }}
                        />
                      </svg>
                    </motion.span>

                    <motion.h2
                      {...stagger(0.08)}
                      id="newsletter-title"
                      className="font-heading text-2xl font-bold leading-[1.15] tracking-[-0.02em] text-dark sm:text-[1.75rem]"
                    >
                      You&rsquo;re on the list.
                    </motion.h2>
                    <motion.p {...stagger(0.14)} className="text-[0.9375rem] leading-relaxed text-gray-600">
                      {alreadySubscribed
                        ? "That address is already with us — welcome back. The next edition is on its way."
                        : "Thank you. Keep an eye on your inbox — the next edition of the list is on its way."}
                    </motion.p>
                    <motion.button
                      {...stagger(0.2)}
                      type="button"
                      onClick={dismiss}
                      className="text-sm font-semibold text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                    >
                      Back to browsing
                    </motion.button>
                  </div>
                ) : (
                  <div className="flex min-h-[22rem] flex-col items-start justify-center gap-5 sm:min-h-[20rem]">
                    <motion.p
                      {...stagger(0.06)}
                      className="text-[0.6875rem] font-semibold uppercase tracking-[0.22em] text-primary"
                    >
                      Private listings · Market notes
                    </motion.p>

                    <motion.h2
                      {...stagger(0.12)}
                      id="newsletter-title"
                      className="font-heading text-[1.625rem] font-bold leading-[1.14] tracking-[-0.02em] text-dark sm:text-[1.875rem]"
                    >
                      See the right homes before the market does.
                    </motion.h2>

                    <motion.p {...stagger(0.18)} className="text-[0.9375rem] leading-[1.65] text-gray-600">
                      A considered monthly email on Lagos property — new listings,
                      pricing context and the occasional off-market opportunity.
                    </motion.p>

                    <motion.form
                      {...stagger(0.24)}
                      onSubmit={onSubmit}
                      noValidate
                      className="w-full"
                    >
                      <label htmlFor="newsletter-email" className="sr-only">
                        Email address
                      </label>
                      <Input
                        ref={inputRef}
                        id="newsletter-email"
                        name="newsletter-email"
                        type="email"
                        autoComplete="email"
                        placeholder="Enter your email address"
                        value={email}
                        disabled={submitState === "submitting"}
                        error={Boolean(error)}
                        aria-describedby={error ? "newsletter-error" : undefined}
                        onChange={(event) => {
                          setEmail(event.target.value);
                          if (error) setError(null);
                        }}
                        className="h-[3.25rem] text-[0.9375rem]"
                      />
                      {error && (
                        <p id="newsletter-error" role="alert" className="mt-2 text-sm text-red-700">
                          {error}
                        </p>
                      )}

                      <Button
                        type="submit"
                        size="lg"
                        loading={submitState === "submitting"}
                        className="group mt-3 w-full gap-2 font-semibold"
                      >
                        Join the list
                        <ArrowRight
                          className="h-4 w-4 transition-transform duration-200 ease-soft group-hover:translate-x-1"
                          aria-hidden="true"
                        />
                      </Button>

                      <p className="mt-3 text-xs leading-relaxed text-gray-500">
                        One email a month. Unsubscribe in one click — we never share
                        your address.
                      </p>
                    </motion.form>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
