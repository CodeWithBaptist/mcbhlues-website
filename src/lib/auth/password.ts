import { randomBytes, scrypt as scryptCb, timingSafeEqual, createHash } from "crypto";
import { promisify } from "util";

const scrypt = promisify(scryptCb) as (
  password: string,
  salt: Buffer,
  keylen: number
) => Promise<Buffer>;

const KEY_LENGTH = 64;

/** Hash a password with scrypt (salted, per-user). Format: scrypt$<salt>$<hash> */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const derived = await scrypt(password, salt, KEY_LENGTH);
  return `scrypt$${salt.toString("hex")}$${derived.toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string | null): Promise<boolean> {
  if (!stored) return false;
  const [scheme, saltHex, hashHex] = stored.split("$");
  if (scheme !== "scrypt" || !saltHex || !hashHex) return false;
  const derived = await scrypt(password, Buffer.from(saltHex, "hex"), KEY_LENGTH);
  const expected = Buffer.from(hashHex, "hex");
  if (expected.length !== derived.length) return false;
  return timingSafeEqual(derived, expected);
}

/** Cryptographically random opaque token (used for sessions & invitations). */
export function generateToken(bytes = 32): string {
  return randomBytes(bytes).toString("base64url");
}

/** Only the hash of a token is ever persisted. */
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export interface PasswordPolicyResult {
  valid: boolean;
  errors: string[];
}

export function validatePasswordStrength(password: string): PasswordPolicyResult {
  const errors: string[] = [];
  if (password.length < 10) errors.push("Password must be at least 10 characters long.");
  if (!/[A-Z]/.test(password)) errors.push("Password must contain an uppercase letter.");
  if (!/[a-z]/.test(password)) errors.push("Password must contain a lowercase letter.");
  if (!/[0-9]/.test(password)) errors.push("Password must contain a number.");
  if (!/[^A-Za-z0-9]/.test(password)) errors.push("Password must contain a symbol.");
  return { valid: errors.length === 0, errors };
}
