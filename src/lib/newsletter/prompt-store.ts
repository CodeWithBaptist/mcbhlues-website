"use client";

import { useSyncExternalStore } from "react";

/**
 * Remembers how the visitor responded to the newsletter prompt.
 *
 * A prompt that reappears on every page view is the fastest way to make a
 * brand feel cheap, so the *decision* — not just the dismissal — is persisted,
 * and the hero sign-up hides itself for good once the address is on the list.
 * Mirrors `lib/consent.ts`: localStorage only (no cookie for a preference),
 * every read guarded, and nothing throws in private mode.
 */

export const NEWSLETTER_PROMPT_KEY = "mcbhlues-newsletter-prompt";

/** Bump to re-ask visitors after a significant change to what they signed up for. */
export const NEWSLETTER_PROMPT_VERSION = 1;

export type NewsletterPromptOutcome = "dismissed" | "subscribed";

export interface NewsletterPromptState {
  version: number;
  outcome: NewsletterPromptOutcome;
  at: string;
}

function rawValue(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(NEWSLETTER_PROMPT_KEY);
  } catch {
    return null;
  }
}

/** Returns `null` for anything malformed or written by an older version. */
export function readNewsletterPrompt(): NewsletterPromptState | null {
  const raw = rawValue();
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<NewsletterPromptState>;
    if (parsed?.version !== NEWSLETTER_PROMPT_VERSION) return null;
    if (parsed.outcome !== "dismissed" && parsed.outcome !== "subscribed") return null;
    return {
      version: NEWSLETTER_PROMPT_VERSION,
      outcome: parsed.outcome,
      at: typeof parsed.at === "string" ? parsed.at : "",
    };
  } catch {
    return null;
  }
}

/** `true` once the visitor has answered either way — the prompt is finished. */
export function hasAnsweredNewsletterPrompt(): boolean {
  return readNewsletterPrompt() !== null;
}

export function recordNewsletterPrompt(outcome: NewsletterPromptOutcome): void {
  const state: NewsletterPromptState = {
    version: NEWSLETTER_PROMPT_VERSION,
    outcome,
    at: new Date().toISOString(),
  };
  try {
    window.localStorage.setItem(NEWSLETTER_PROMPT_KEY, JSON.stringify(state));
  } catch {
    /* private mode / storage disabled — the prompt may simply reappear */
  }
}

/** Clears the stored answer so the prompt is shown again (used by tests). */
export function resetNewsletterPrompt(): void {
  try {
    window.localStorage.removeItem(NEWSLETTER_PROMPT_KEY);
  } catch {
    /* ignore */
  }
}

/* -------------------------------------------------------------------------- */
/*  React binding                                                              */
/* -------------------------------------------------------------------------- */

/** A second tab signing up should retire the form in this one too. */
function subscribeToPrompt(onStoreChange: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("storage", onStoreChange);
  return () => window.removeEventListener("storage", onStoreChange);
}

/**
 * `true` once this browser has joined the list.
 *
 * `useSyncExternalStore` rather than an effect: the server has no storage to
 * read, so it always renders the sign-up and the client decides during
 * hydration. No flash of a form for someone who is already subscribed, and no
 * cascading render to wait for.
 */
export function useHasSubscribedToNewsletter(): boolean {
  return useSyncExternalStore(
    subscribeToPrompt,
    () => readNewsletterPrompt()?.outcome === "subscribed",
    () => false
  );
}
