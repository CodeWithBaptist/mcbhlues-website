"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

export type StaffTheme = "light" | "dark";

const STORAGE_KEY = "mcbhlues-portal-theme";
const DARK_CLASS = "portal-dark";

interface StaffThemeContextValue {
  theme: StaffTheme;
  toggleTheme: () => void;
}

const StaffThemeContext = createContext<StaffThemeContextValue | null>(null);

function themeFromDocument(): StaffTheme {
  if (typeof document !== "undefined" && document.documentElement.classList.contains(DARK_CLASS)) {
    return "dark";
  }
  return "light";
}

function applyTheme(theme: StaffTheme) {
  document.documentElement.classList.toggle(DARK_CLASS, theme === "dark");
}

export function StaffThemeProvider({ children }: { children: ReactNode }) {
  // The root layout bootstraps the class before paint. The portal preference
  // has its own key and class so it can never change the public website theme.
  const [theme, setTheme] = useState<StaffTheme>(themeFromDocument);

  useEffect(() => {
    applyTheme(theme);
    window.localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((current) => (current === "dark" ? "light" : "dark"));
  }, []);

  return (
    <StaffThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </StaffThemeContext.Provider>
  );
}

export function useStaffTheme() {
  const context = useContext(StaffThemeContext);
  if (!context) {
    throw new Error("useStaffTheme must be used within a StaffThemeProvider");
  }
  return context;
}
