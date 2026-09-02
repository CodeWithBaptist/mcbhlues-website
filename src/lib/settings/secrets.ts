/**
 * Helpers for settings values that must never be echoed back to the UI or
 * written into the audit log in plain text (SMTP passwords, API keys, …).
 * The real value only ever lives in the settings table itself.
 */

export const MASKED_VALUE = "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022";

export function isSensitiveKey(key: string): boolean {
  return /(pass|secret|token|api_key)/i.test(key);
}

/** Replaces the value of sensitive keys with a fixed mask. */
export function maskIfSensitive(key: string, value: string | null | undefined): string {
  const text = value == null ? "" : String(value);
  if (isSensitiveKey(key) && text !== "") return MASKED_VALUE;
  return text;
}
