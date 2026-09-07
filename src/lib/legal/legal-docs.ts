import { eq, inArray } from "drizzle-orm";
import { getDb } from "@/db";
import { cmsContent } from "@/db/schema";
import { DEFAULT_LEGAL_DOCS } from "./legal-defaults";
import { invalidatePublicSite } from "@/lib/cache";

export interface LegalDoc {
  slug: string;
  /** Short label for portal tabs. Never rendered on the public site. */
  label: string;
  title: string;
  summary: string;
  /** ISO date (YYYY-MM-DD) shown as “Last updated”. */
  updated: string;
  body: string;
}

export const LEGAL_SLUGS = ["privacy", "terms", "cookies"] as const;
export type LegalSlug = (typeof LEGAL_SLUGS)[number];

export function isLegalSlug(slug: string): slug is LegalSlug {
  return (LEGAL_SLUGS as readonly string[]).includes(slug);
}

const FIELDS = ["title", "summary", "body", "updated"] as const;
type LegalField = (typeof FIELDS)[number];

const keyFor = (slug: string, field: LegalField) => `legal.${slug}.${field}`;

/** Every document with saved overrides merged over the defaults. */
export async function getLegalDocs(): Promise<LegalDoc[]> {
  const db = await getDb();
  const keys = LEGAL_SLUGS.flatMap((slug) => FIELDS.map((field) => keyFor(slug, field)));
  const rows = await db.select().from(cmsContent).where(inArray(cmsContent.key, keys));
  const saved = new Map(rows.map((row) => [row.key, row.value]));
  return DEFAULT_LEGAL_DOCS.map((defaults) => ({
    slug: defaults.slug,
    label: defaults.label,
    title: saved.get(keyFor(defaults.slug, "title")) || defaults.title,
    summary: saved.get(keyFor(defaults.slug, "summary")) || defaults.summary,
    body: saved.get(keyFor(defaults.slug, "body")) || defaults.body,
    updated: saved.get(keyFor(defaults.slug, "updated")) || defaults.updated,
  }));
}

export async function getLegalDoc(slug: string): Promise<LegalDoc> {
  if (!isLegalSlug(slug)) throw new Error(`Unknown legal document: ${slug}`);
  const docs = await getLegalDocs();
  const doc = docs.find((item) => item.slug === slug);
  if (!doc) throw new Error(`Unknown legal document: ${slug}`);
  return doc;
}

export interface LegalDocInput {
  title?: string;
  summary?: string;
  body?: string;
  updated?: string;
}

const FIELD_LABELS: Record<LegalField, string> = {
  title: "page title",
  summary: "page summary",
  body: "policy text",
  updated: "last-updated date",
};

/** Saves whichever fields are provided; the rest keep their current values. */
export async function saveLegalDoc(
  slug: string,
  input: LegalDocInput,
  actorId: string
): Promise<LegalDoc> {
  if (!isLegalSlug(slug)) throw new Error(`Unknown legal document: ${slug}`);
  const db = await getDb();
  const defaults = DEFAULT_LEGAL_DOCS.find((item) => item.slug === slug);
  if (!defaults) throw new Error(`Unknown legal document: ${slug}`);

  for (const field of FIELDS) {
    const value = input[field];
    if (value === undefined) continue;
    const key = keyFor(slug, field);
    const [existing] = await db.select().from(cmsContent).where(eq(cmsContent.key, key)).limit(1);
    if (existing) {
      await db
        .update(cmsContent)
        .set({ value, updatedBy: actorId, updatedAt: new Date() })
        .where(eq(cmsContent.key, key));
    } else {
      await db.insert(cmsContent).values({
        key,
        label: `Legal: ${defaults.label} ${FIELD_LABELS[field]}`,
        section: "legal",
        value,
        updatedBy: actorId,
      });
    }
  }

  invalidatePublicSite();
  return getLegalDoc(slug);
}

/** Deletes every override so the document falls back to its default text. */
export async function resetLegalDoc(slug: string): Promise<LegalDoc> {
  if (!isLegalSlug(slug)) throw new Error(`Unknown legal document: ${slug}`);
  const db = await getDb();
  await db
    .delete(cmsContent)
    .where(
      inArray(
        cmsContent.key,
        FIELDS.map((field) => keyFor(slug, field))
      )
    );
  invalidatePublicSite();
  return getLegalDoc(slug);
}
