"use client";

// Compatibility exports: portal controls consume the public site's context,
// storage preference and cross-tab synchronisation, not a second theme system.
export { ThemeProvider as StaffThemeProvider, useTheme as useStaffTheme } from "./theme-provider";
export type { Theme as StaffTheme } from "./theme-provider";
