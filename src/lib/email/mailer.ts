import { desc, inArray } from "drizzle-orm";
import nodemailer from "nodemailer";
import { getDb } from "@/db";
import { emailOutbox, settings } from "@/db/schema";
import { MASKED_VALUE } from "@/lib/settings/secrets";

/**
 * Outgoing email transport for the Staff Portal.
 *
 * Configuration lives in Portal → System Settings ("Email delivery") and is
 * backed by the `settings` table; environment variables act as a fallback for
 * deployments that prefer infrastructure config. Every send attempt — whether
 * delivered, queued (no transport configured) or rejected — is written to the
 * `email_outbox` table so delivery can be audited from the portal.
 */

export interface EmailConfig {
  host: string;
  port: number;
  secure: boolean; // true → SSL/465, false → STARTTLS/587
  user: string;
  pass: string;
  from: string;
  /** Display name used in the From header. */
  fromName: string;
}

export type EmailStatus = "sent" | "queued" | "failed";

export interface SendEmailInput {
  to: string;
  subject: string;
  text: string;
  /** Logical name of the template/flow, e.g. "enquiry_response". */
  purpose?: string;
  /** Optional HTML body; plain `text` is always provided as fallback. */
  html?: string;
}

export interface SendEmailResult {
  status: EmailStatus;
  error?: string;
}

const SETTINGS_KEYS = [
  "system.smtp_host",
  "system.smtp_port",
  "system.smtp_secure",
  "system.smtp_user",
  "system.smtp_pass",
  "system.email_from",
  "system.email_from_name",
] as const;

function toStr(value: unknown): string {
  if (value == null) return "";
  return String(value).trim();
}

function toBool(value: unknown, fallback = false): boolean {
  const text = toStr(value).toLowerCase();
  if (text === "") return fallback;
  return text === "true" || text === "1" || text === "yes" || text === "on";
}

function toInt(value: unknown, fallback: number): number {
  const parsed = Number.parseInt(toStr(value), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

/**
 * Resolves SMTP configuration. Database settings win over environment
 * variables so the portal UI is always authoritative once filled in.
 */
export async function getEmailConfig(): Promise<EmailConfig> {
  const db = await getDb();
  const rows = await db
    .select()
    .from(settings)
    .where(inArray(settings.key, [...SETTINGS_KEYS]));

  const byKey = new Map<string, unknown>();
  for (const row of rows) byKey.set(row.key, row.value);

  const get = (key: string) => {
    const value = toStr(byKey.get(key));
    // Never trust a masked placeholder echoed back from the UI.
    return value === MASKED_VALUE ? "" : value;
  };

  return {
    host: get("system.smtp_host") || process.env.SMTP_HOST || "",
    port: toInt(get("system.smtp_port") || process.env.SMTP_PORT, 587),
    secure: toBool(get("system.smtp_secure") || process.env.SMTP_SECURE, false),
    user: get("system.smtp_user") || process.env.SMTP_USER || "",
    pass: get("system.smtp_pass") || process.env.SMTP_PASS || "",
    from: get("system.email_from") || process.env.EMAIL_FROM || "",
    fromName:
      get("system.email_from_name") ||
      process.env.EMAIL_FROM_NAME ||
      "MCBHLUES ENTERPRISES",
  };
}

/** A transport is usable once a host is present. User/pass are optional (relay). */
export function isEmailConfigured(config: EmailConfig): boolean {
  return config.host.length > 0;
}

function buildFrom(config: EmailConfig): string {
  const address = config.from || config.user || "no-reply@mcbhlues.com";
  const name = config.fromName.replace(/"/g, "").trim();
  return name ? `"${name}" <${address}>` : address;
}

/**
 * Send an email. Never throws — callers always get a result object.
 *
 * - If SMTP is configured the message is delivered and logged as "sent"
 *   (or "failed" with the server's reason).
 * - If no transport is configured the message is logged as "queued" so it is
 *   visible in System Logs, but nothing is delivered.
 */
export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const config = await getEmailConfig();
  const purpose = input.purpose ?? "general";

  if (!isEmailConfigured(config)) {
    await recordOutbox({ ...input, purpose, status: "queued" });
    console.info(
      `[email] SMTP not configured — "${input.subject}" to ${input.to} stored in the outbox.`
    );
    return {
      status: "queued",
      error: "No SMTP transport configured. Add SMTP details under System Settings → Email delivery.",
    };
  }

  try {
    const transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: config.user ? { user: config.user, pass: config.pass } : undefined,
      connectionTimeout: 15_000,
      greetingTimeout: 15_000,
      socketTimeout: 20_000,
    });

    await transporter.sendMail({
      from: buildFrom(config),
      to: input.to,
      subject: input.subject,
      text: input.text,
      ...(input.html ? { html: input.html } : {}),
    });

    await recordOutbox({ ...input, purpose, status: "sent" });
    return { status: "sent" };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await recordOutbox({ ...input, purpose, status: "failed", error: message });
    console.error(`[email] send failed (${purpose} → ${input.to}):`, message);
    return { status: "failed", error: message };
  }
}

async function recordOutbox(input: {
  to: string;
  subject: string;
  text: string;
  purpose: string;
  status: EmailStatus;
  error?: string;
}): Promise<void> {
  try {
    const db = await getDb();
    await db.insert(emailOutbox).values({
      toEmail: input.to,
      subject: input.subject,
      body: input.text,
      purpose: input.purpose,
      status: input.status,
      error: input.error ?? null,
      sentAt: input.status === "sent" ? new Date() : null,
    });
  } catch (error) {
    // Logging must never break the primary action.
    console.error("[email] failed to record outbox entry", error);
  }
}

export interface OutboxEntry {
  id: string;
  toEmail: string;
  subject: string;
  purpose: string;
  status: string;
  error: string | null;
  createdAt: string;
  sentAt: string | null;
}

/** Recent outgoing mail for the System Logs screen. */
export async function listOutbox(limit = 50): Promise<OutboxEntry[]> {
  const db = await getDb();
  const rows = await db
    .select()
    .from(emailOutbox)
    .orderBy(desc(emailOutbox.createdAt))
    .limit(limit);

  return rows.map((row) => ({
    id: row.id,
    toEmail: row.toEmail,
    subject: row.subject,
    purpose: row.purpose,
    status: row.status,
    error: row.error,
    createdAt: row.createdAt.toISOString(),
    sentAt: row.sentAt ? row.sentAt.toISOString() : null,
  }));
}
