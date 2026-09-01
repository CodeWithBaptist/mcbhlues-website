import { eq, inArray } from "drizzle-orm";
import { getDb } from "@/db";
import { settings } from "@/db/schema";

/**
 * Runtime accessors for the values editable under Portal → System Settings.
 * Every accessor falls back to the shipped default when the row has never
 * been saved, so a fresh database behaves exactly like before.
 */

export const SYSTEM_DEFAULTS = {
  SESSION_HOURS: 12,
  INVITE_TTL_HOURS: 72,
  PASSWORD_MIN_LENGTH: 10,
} as const;

export const SECURITY_DEFAULTS = {
  /** minutes of no activity before a session is considered idle (0 = off) */
  IDLE_TIMEOUT_MINUTES: 0,
  /** failed logins before the account is locked for a cooldown (0 = off) */
  MAX_FAILED_LOGINS: 0,
  /** minutes a locked account must wait before trying again */
  LOCKOUT_MINUTES: 15,
  /** force staff to change their password after an invite/reset (informational) */
  FORCE_PASSWORD_ROTATION_DAYS: 0,
} as const;

async function readSystemValues(keys: string[]): Promise<Map<string, string>> {
  try {
    const db = await getDb();
    const rows = await db
      .select({ key: settings.key, value: settings.value })
      .from(settings)
      .where(inArray(settings.key, keys));
    return new Map(rows.map((row) => [row.key, row.value == null ? "" : String(row.value)]));
  } catch {
    return new Map();
  }
}

function toPositiveInt(raw: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(raw ?? "", 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

/** Session lifetime in hours (system.session_hours). */
export async function getSessionHours(): Promise<number> {
  const values = await readSystemValues(["system.session_hours"]);
  const parsed = toPositiveInt(values.get("system.session_hours"), SYSTEM_DEFAULTS.SESSION_HOURS);
  return parsed > 0 ? parsed : SYSTEM_DEFAULTS.SESSION_HOURS;
}

/** Invitation validity in hours (system.invite_ttl_hours). */
export async function getInviteTtlHours(): Promise<number> {
  const values = await readSystemValues(["system.invite_ttl_hours"]);
  const parsed = toPositiveInt(values.get("system.invite_ttl_hours"), SYSTEM_DEFAULTS.INVITE_TTL_HOURS);
  return parsed > 0 ? parsed : SYSTEM_DEFAULTS.INVITE_TTL_HOURS;
}

/** Minimum password length enforced everywhere passwords are set. */
export async function getPasswordMinLength(): Promise<number> {
  const values = await readSystemValues(["system.password_min_length"]);
  const parsed = toPositiveInt(
    values.get("system.password_min_length"),
    SYSTEM_DEFAULTS.PASSWORD_MIN_LENGTH
  );
  return parsed >= 8 ? parsed : SYSTEM_DEFAULTS.PASSWORD_MIN_LENGTH;
}
