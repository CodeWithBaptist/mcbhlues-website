"use client";

import { createContext, useCallback, useContext, useSyncExternalStore, type ReactNode } from "react";

export type Theme = "light" | "dark";
const STORAGE_KEY = "mcbhlues-public-theme";
const CHANGE_EVENT = "mcbhlues-theme-change";

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
}
const ThemeContext = createContext<ThemeContextValue | null>(null);

function readTheme(): Theme {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === "light" || saved === "dark") return saved;
  } catch { /* Storage can be disabled; the document remains the visit's state. */ }
  return document.documentElement.classList.contains("public-dark") ? "dark" : "light";
}

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle("public-dark", theme === "dark");
  document.documentElement.classList.toggle("portal-dark", theme === "dark");
}

function subscribe(onChange: () => void) {
  const sync = () => { applyTheme(readTheme()); onChange(); };
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY || event.key === null) sync();
  };
  window.addEventListener("storage", onStorage);
  window.addEventListener(CHANGE_EVENT, sync);
  // Reconcile changes made by another tab while this one was hydrating.
  // Never write an initial light snapshot over a newer saved preference.
  sync();
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(CHANGE_EVENT, sync);
  };
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const theme = useSyncExternalStore(subscribe, readTheme, () => "light" as const);
  const toggleTheme = useCallback(() => {
    const next = readTheme() === "dark" ? "light" : "dark";
    applyTheme(next);
    try { window.localStorage.setItem(STORAGE_KEY, next); } catch { /* Visit-only preference. */ }
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }, []);
  return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within a ThemeProvider");
  return context;
}
