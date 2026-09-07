"use client";

import { useSyncExternalStore } from "react";

/**
 * Saved properties ("favourites"), stored in the visitor's own browser.
 *
 * No cookie, no account, no server round-trip: the list never leaves the
 * device, which is exactly what the privacy policy promises. Modelled as an
 * external store (same shape as `lib/consent.ts`) so the navbar counter, the
 * card buttons and the /favorites page all stay in sync — across tabs — with
 * no `useEffect`-driven state and no hydration mismatch.
 */

export const FAVORITES_STORAGE_KEY = "mcbhlues-favorites";
export const FAVORITES_EVENT = "mcbhlues:favorites-change";

/** Plenty for a browsing session, and keeps localStorage tiny. */
const MAX_FAVORITES = 100;

function rawValue(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(FAVORITES_STORAGE_KEY);
  } catch {
    return null;
  }
}

const EMPTY: readonly string[] = Object.freeze([]);

function parse(raw: string | null): readonly string[] {
  if (!raw) return EMPTY;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return EMPTY;
    const ids = parsed
      .filter((id): id is string => typeof id === "string" && id.length > 0)
      .slice(0, MAX_FAVORITES);
    return ids.length ? Object.freeze(ids) : EMPTY;
  } catch {
    return EMPTY;
  }
}

/*
 * `useSyncExternalStore` compares snapshots by reference, so re-parsing on
 * every call would loop forever. Cache the parsed array and rebuild it only
 * when the underlying string actually changes.
 */
let cachedRaw: string | null = null;
let cachedIds: readonly string[] = EMPTY;
let primed = false;

export function readFavorites(): readonly string[] {
  const raw = rawValue();
  if (!primed || raw !== cachedRaw) {
    cachedRaw = raw;
    cachedIds = parse(raw);
    primed = true;
  }
  return cachedIds;
}

/** The server (and the first hydration pass) always sees an empty list. */
function serverSnapshot(): readonly string[] {
  return EMPTY;
}

const listeners = new Set<() => void>();

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key === FAVORITES_STORAGE_KEY) listener();
  };
  const onLocal = () => listener();
  window.addEventListener("storage", onStorage);
  window.addEventListener(FAVORITES_EVENT, onLocal);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(FAVORITES_EVENT, onLocal);
  };
}

function write(ids: readonly string[]) {
  try {
    window.localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(ids));
  } catch {
    /* private mode / quota — the toggle just doesn't persist */
  }
  window.dispatchEvent(new Event(FAVORITES_EVENT));
  for (const listener of listeners) listener();
}

/** Adds or removes an id. Returns `true` when the property is now saved. */
export function toggleFavorite(id: string): boolean {
  const current = readFavorites();
  const saved = current.includes(id);
  // Newest first, so the /favorites page reads like a recent-activity list.
  write(saved ? current.filter((x) => x !== id) : [id, ...current].slice(0, MAX_FAVORITES));
  return !saved;
}

export function clearFavorites() {
  write([]);
}

/** The saved ids. Empty during SSR and the hydration pass. */
export function useFavorites(): readonly string[] {
  return useSyncExternalStore(subscribe, readFavorites, serverSnapshot);
}

/** Whether one property is saved. */
export function useIsFavorite(id: string): boolean {
  return useFavorites().includes(id);
}
