import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/* -------------------------------------------------------------------------- */
/*  Currency                                                                   */
/* -------------------------------------------------------------------------- */

/** Currencies the portal can price properties in. Naira is the default. */
export const SUPPORTED_CURRENCIES = [
  { code: "NGN", symbol: "₦", label: "Nigerian Naira (₦)" },
  { code: "USD", symbol: "$", label: "US Dollar ($)" },
  { code: "GBP", symbol: "£", label: "British Pound (£)" },
  { code: "EUR", symbol: "€", label: "Euro (€)" },
  { code: "GHS", symbol: "₵", label: "Ghanaian Cedi (₵)" },
  { code: "ZAR", symbol: "R", label: "South African Rand (R)" },
  { code: "CAD", symbol: "CA$", label: "Canadian Dollar (CA$)" },
  { code: "AED", symbol: "د.إ", label: "UAE Dirham (د.إ)" },
] as const;

export const DEFAULT_CURRENCY = "NGN";

const SYMBOLS: Record<string, string> = Object.fromEntries(
  SUPPORTED_CURRENCIES.map((entry) => [entry.code, entry.symbol])
);

/** The symbol for a currency code — falls back to the code itself. */
export function currencySymbol(code?: string | null): string {
  const key = (code || DEFAULT_CURRENCY).toUpperCase();
  return SYMBOLS[key] ?? key;
}

/**
 * Format a price for display, e.g. `formatCurrency(85000000, "NGN")` → `₦85,000,000`.
 * Intl is used when the runtime knows the code so grouping matches the locale,
 * but the symbol is always forced to the one above (some runtimes render NGN
 * as "NGN" instead of "₦", which is exactly the bug this fixes).
 */
export function formatCurrency(
  amount: number,
  code: string | null | undefined = DEFAULT_CURRENCY,
  options: { compact?: boolean } = {}
): string {
  const currency = (code || DEFAULT_CURRENCY).toUpperCase();
  const symbol = currencySymbol(currency);
  const safeAmount = Number.isFinite(amount) ? amount : 0;

  if (options.compact && Math.abs(safeAmount) >= 1_000_000) {
    const millions = safeAmount / 1_000_000;
    const billions = safeAmount / 1_000_000_000;
    return Math.abs(safeAmount) >= 1_000_000_000
      ? `${symbol}${trimZero(billions)}B`
      : `${symbol}${trimZero(millions)}M`;
  }

  let body: string;
  try {
    body = new Intl.NumberFormat("en-NG", {
      maximumFractionDigits: 0,
    }).format(safeAmount);
  } catch {
    body = safeAmount.toLocaleString();
  }
  return `${symbol}${body}`;
}

function trimZero(value: number): string {
  return value.toFixed(1).replace(/\.0$/, "");
}
