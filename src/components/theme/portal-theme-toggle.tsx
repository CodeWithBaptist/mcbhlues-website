"use client";

import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";
import { useStaffTheme } from "./staff-theme-provider";

export function PortalThemeToggle({ onDarkSurface = false }: { onDarkSurface?: boolean }) {
  const { toggleTheme } = useStaffTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={cn(
        "portal-theme-toggle inline-flex items-center justify-center gap-2 rounded-full border p-2 transition-colors",
        onDarkSurface
          ? "border-white/20 text-white hover:bg-white/10 hover:text-white"
          : "border-gray-200 text-dark hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
      )}
      aria-label="Toggle portal color theme"
      title="Toggle portal color theme"
    >
      <Moon className="portal-theme-moon h-4 w-4" />
      <Sun className="portal-theme-sun hidden h-4 w-4" />
    </button>
  );
}
