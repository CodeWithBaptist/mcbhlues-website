"use client";

import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "./theme-provider";

export function ThemeToggle({ showLabel = false }: { showLabel?: boolean }) {
  const { toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full border border-gray-200 p-2 text-dark transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-primary",
        showLabel && "w-full justify-between rounded-lg px-3 py-2.5 text-sm font-semibold"
      )}
      aria-label="Toggle color theme"
      title="Toggle color theme"
    >
      <Moon className="public-theme-moon h-4 w-4" />
      <Sun className="public-theme-sun hidden h-4 w-4" />
      {showLabel && <span>Toggle theme</span>}
    </button>
  );
}
