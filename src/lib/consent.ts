"use client";

import { useSyncExternalStore } from "react";

/**
 * Cookie / analytics consent, stored in localStorage (no cookie is written for
 * the preference itself — that would be self-defeating).
 *
 * The site sets **no** non-essential cookies until `analytics` is granted.
 * Exposed as an external store via `useConsent()` so components stay in sync
 * across tabs without `useEffect`-driven state.
 */

export const CONSENT_STORAGE_KEY = "mcbhlues-cookie-consent";
export const CONSENT_EVENT = "mcbhlues:consent-change";

/** Bump when the categories change so returning visitors are re-asked. */
export const CONSENT_VERSION = 1;

export type ConsentDecision = "accepted" | "rejected";

export interface ConsentState {
  version: number;
  analytics: boolean;
  decidedAt: string;
}

function rawValue(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(CONSENT_STORAGE_KEY);
  } catch {
    return null;
  }
}

function parse(raw: string | null): ConsentState | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<ConsentState>;
    if (parsed?.version !== CONSENT_VERSION) return null;
    if (typeof parsed.analytics !== "boolean") return null;
    return {
      version: CONSENT_VERSION,
      analytics: parsed.analytics,
      decidedAt: typeof parsed.decidedAt === "string" ? parsed.decidedAt : "",
    };
  } catch {
    return null;
  }
}

/*
 * `useSyncExternalStore` compares snapshots by reference, so parsing on every
 * call would loop forever. Cache the parsed object and only rebuild it when the
 * underlying string actually changes.
 */
let cachedRaw: string | null = null;
let cachedState: ConsentState | null = null;
let primed = false;

export function readConsent(): ConsentState | null {
  const raw = rawValue();
  if (!primed || raw !== cachedRaw) {
    cachedRaw = raw;
    cachedState = parse(raw);
    primed = true;
  }
  return cachedState;
}

/** Server render (and the first hydration pass) always sees "not decided". */
function serverSnapshot(): ConsentState | null {
  return null;
}

const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key === CONSENT_STORAGE_KEY) listener();
  };
  const onLocal = () => listener();
  window.addEventListener("storage", onStorage);
  window.addEventListener(CONSENT_EVENT, onLocal);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(CONSENT_EVENT, onLocal);
  };
}

export function writeConsent(decision: ConsentDecision): ConsentState {
  const state: ConsentState = {
    version: CONSENT_VERSION,
    analytics: decision === "accepted",
    decidedAt: new Date().toISOString(),
  };
  try {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* private mode / storage disabled — the banner simply reappears */
  }
  window.dispatchEvent(new Event(CONSENT_EVENT));
  emit();
  return state;
}

/** Clears the stored choice so the banner is shown again. */
export function resetConsent() {
  try {
    window.localStorage.removeItem(CONSENT_STORAGE_KEY);
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new Event(CONSENT_EVENT));
  emit();
}

/** Current decision, or `null` while the visitor has not chosen yet. */
export function useConsent(): ConsentState | null {
  return useSyncExternalStore(subscribe, readConsent, serverSnapshot);
}

const noopSubscribe = () => () => {};

/**
 * `false` during SSR and the hydration pass, `true` afterwards. Lets a
 * component defer browser-only UI without a `useEffect`/`setState` dance, and
 * without ever producing a hydration mismatch.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false
  );
}
