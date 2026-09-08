"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { validateSubscriptionEmail } from "@/lib/newsletter/subscription";
import {
  recordNewsletterPrompt,
  useHasSubscribedToNewsletter,
} from "@/lib/newsletter/prompt-store";

/**
 * Newsletter sign-up, tucked into the homepage hero beside the photograph —
 * it occupies the slot the small "give us a call" line used to fill, so the
 * hero keeps its headline, subtitle and primary button untouched.
 *
 * Deliberately compact: one short heading, one line of copy, one field and one
 * button. It posts to the same `/api/public/subscribe` endpoint the inline
 * section used, honeypot included, so the anti-abuse checks there still apply.
 *
 * It is a one-time ask, and it really does get out of the way. A successful
 * join records the outcome in `localStorage` (see `lib/newsletter/prompt-store`),
 * the form is replaced by a single acknowledgement line that fades itself out
 * after a moment, and the whole section is gone from every later visit — a
 * sign-up form shown to someone already on the list is noise. Errors record
 * nothing, so a retry is always possible.
 */
type SubmitState = "idle" | "submitting" | "success";

/** How long the acknowledgement stays up before the section removes itself. */
const ACKNOWLEDGEMENT_MS = 8000;
const FADE_MS = 500;

export function NewsletterSignup() {
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [alreadySubscribed, setAlreadySubscribed] = useState(false);
  const [welcomeSent, setWelcomeSent] = useState(false);
  const [acknowledgement, setAcknowledgement] = useState<"visible" | "fading" | "gone">("visible");
  // Someone who joined on an earlier visit never sees the form again — the
  // success line is the only exception, so the acknowledgement is still read.
  const onTheListAlready = useHasSubscribedToNewsletter();
  const inputRef = useRef<HTMLInputElement>(null);
  const timers = useRef<number[]>([]);

  useEffect(
    () => () => {
      for (const timer of timers.current) window.clearTimeout(timer);
      timers.current = [];
    },
    []
  );

  /**
   * Fades the acknowledgement out, then removes it. Timers rather than CSS
   * animation events, and reduced motion shortens nothing but the fade: the
   * line still gets its full reading time.
   */
  function hideAcknowledgementSoon() {
    const reducedMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reducedMotion) {
      timers.current.push(
        window.setTimeout(() => setAcknowledgement("gone"), ACKNOWLEDGEMENT_MS)
      );
      return;
    }

    timers.current.push(
      window.setTimeout(() => setAcknowledgement("fading"), ACKNOWLEDGEMENT_MS),
      window.setTimeout(() => setAcknowledgement("gone"), ACKNOWLEDGEMENT_MS + FADE_MS)
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const validation = validateSubscriptionEmail(email);
    if (validation) {
      setError(validation);
      inputRef.current?.focus();
      return;
    }

    setSubmitState("submitting");
    setError(null);
    try {
      const res = await fetch("/api/public/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, company }),
      });
      const data = (await res.json().catch(() => null)) as
        | { ok?: boolean; alreadySubscribed?: boolean; welcomeSent?: boolean; error?: string }
        | null;

      if (res.ok && data?.ok) {
        setAlreadySubscribed(Boolean(data.alreadySubscribed));
        setWelcomeSent(Boolean(data.welcomeSent));
        setSubmitState("success");
        // The address is stored server-side; this only remembers that *this*
        // browser has answered the prompt, so the section can stay out of the
        // way from now on.
        recordNewsletterPrompt("subscribed");
        hideAcknowledgementSoon();
      } else {
        setSubmitState("idle");
        setError(data?.error ?? "We couldn't add that address just now. Please try again.");
        inputRef.current?.focus();
      }
    } catch {
      setSubmitState("idle");
      setError("Something went wrong. Please try again in a moment.");
      inputRef.current?.focus();
    }
  }

  if (acknowledgement === "gone" || (onTheListAlready && submitState !== "success")) {
    return null;
  }

  if (submitState === "success") {
    // The form is gone; one line says what happened, then retires itself.
    // `role="status"` announces it to screen readers, which matters most here
    // because the field they were typing in has vanished underneath them.
    return (
      <div
        className={`mt-10 border-t border-gray-200 pt-8 transition-opacity duration-500 ease-soft motion-reduce:transition-none sm:mt-12 ${
          acknowledgement === "fading" ? "opacity-0" : "animate-fade-in opacity-100"
        }`}
      >
        <p role="status" className="flex max-w-md items-start gap-3 text-sm leading-relaxed text-gray-700">
          <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Check className="h-3.5 w-3.5" aria-hidden="true" />
          </span>
          <span>
            {alreadySubscribed
              ? "You were already on the list — welcome back. The next edition is on its way."
              : welcomeSent
                ? "You're on the list. A confirmation is in your inbox now, and the next edition follows once a month."
                : "You're on the list. The next edition — new listings, pricing context and the occasional off-market home — will reach you by email."}
          </span>
        </p>
      </div>
    );
  }

  return (
    <div className="mt-10 max-w-md border-t border-gray-200 pt-8 sm:mt-12">
      <h2 className="font-heading text-lg font-bold leading-snug tracking-tight text-dark sm:text-xl">
        See the right homes before the market does.
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-gray-600">
        One email a month — new Lagos listings, pricing context and the
        occasional off-market opportunity.
      </p>

      <form onSubmit={onSubmit} noValidate className="relative mt-4 flex flex-col gap-2.5 sm:flex-row sm:items-start">
        <div className="flex-1">
          <label htmlFor="hero-newsletter-email" className="sr-only">
            Email address
          </label>
          <Input
            ref={inputRef}
            id="hero-newsletter-email"
            name="hero-newsletter-email"
            type="email"
            autoComplete="email"
            placeholder="Enter your email address"
            value={email}
            disabled={submitState === "submitting"}
            error={Boolean(error)}
            aria-describedby={
              error ? "hero-newsletter-error" : "hero-newsletter-privacy"
            }
            onChange={(e) => {
              setEmail(e.target.value);
              if (error) setError(null);
            }}
            className="h-11 text-[0.9375rem]"
          />
        </div>
        <Button
          type="submit"
          size="md"
          loading={submitState === "submitting"}
          className="group h-11 shrink-0 gap-2 px-6 text-[0.9375rem] font-semibold"
        >
          Join the list
          <ArrowRight
            className="h-4 w-4 transition-transform duration-200 ease-soft group-hover:translate-x-1"
            aria-hidden="true"
          />
        </Button>

        {/* Honeypot — off-screen rather than `hidden`, so bots that skip
            display:none fields still fill it in. Never focusable. */}
        <div
          aria-hidden="true"
          className="absolute left-[-9999px] top-auto h-px w-px overflow-hidden"
        >
          <label htmlFor="hero-newsletter-company">
            Company (leave this field empty)
          </label>
          <input
            id="hero-newsletter-company"
            name="company"
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={company}
            onChange={(event) => setCompany(event.target.value)}
          />
        </div>
      </form>

      {error && (
        <p
          id="hero-newsletter-error"
          role="alert"
          className="mt-2.5 text-sm leading-relaxed text-red-700"
        >
          {error}
        </p>
      )}

      <p id="hero-newsletter-privacy" className="mt-2.5 text-xs leading-relaxed text-gray-500">
        We never share your address. Read our{" "}
        <a
          href="/privacy"
          className="underline underline-offset-4 hover:text-dark"
        >
          privacy policy
        </a>
        .
      </p>
    </div>
  );
}
