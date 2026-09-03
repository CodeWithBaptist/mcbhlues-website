"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

export type Theme = "light" | "dark";

const STORAGE_KEY = "mcbhlues-public-theme";
const DARK_CLASS = "public-dark";

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function themeFromDocument(): Theme {
  if (typeof document !== "undefined" && document.documentElement.classList.contains(DARK_CLASS)) {
    return "dark";
  }
  return "light";
}

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle(DARK_CLASS, theme === "dark");
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  // The root layout bootstraps the class before paint. Reading that class here
  // keeps the toggle in sync without a second render just to detect the theme.
  const [theme, setTheme] = useState<Theme>(themeFromDocument);

  useEffect(() => {
    applyTheme(theme);
    window.localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((current) => (current === "dark" ? "light" : "dark"));
  }, []);

  return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
