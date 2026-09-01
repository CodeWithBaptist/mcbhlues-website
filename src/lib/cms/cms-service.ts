import { asc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { announcements, cmsContent, faqs, testimonials } from "@/db/schema";

/* -------------------------------------------------------------------------- */
/*  Content blocks (homepage / about / contact copy)                           */
/* -------------------------------------------------------------------------- */

export interface CmsBlock {
  key: string;
  label: string;
  section: string;
  value: string;
  /** rendered as a multi-line editor when true */
  multiline?: boolean;
  placeholder?: string;
}

/**
 * The catalogue of editable copy blocks. Public pages use `getCmsValues` and
 * fall back to the defaults below when a block has never been saved.
 */
export const CMS_BLOCKS: CmsBlock[] = [
  {
    key: "home.hero_badge",
    label: "Homepage hero badge",
    section: "homepage",
    value: "Welcome to MCBHLUES ENTERPRISES",
  },
  {
    key: "home.hero_title",
    label: "Homepage hero title",
    section: "homepage",
    value: "Redefining Luxury & Innovation in Real Estate",
  },
  {
    key: "home.hero_subtitle",
    label: "Homepage hero subtitle",
    section: "homepage",
    value:
      "Specializing in high-end consulting, avant-garde property development, and elite facility management for discerning clients.",
    multiline: true,
  },
  {
    key: "about.story_title",
    label: "About page — story heading",
    section: "about",
    value: "Our Story",
  },
  {
    key: "about.story_body",
    label: "About page — story text",
    section: "about",
    value: "",
    multiline: true,
    placeholder: "Leave empty to keep the default story content.",
  },
  {
    key: "contact.blurb",
    label: "Contact page — intro text",
    section: "contact",
    value: "",
    multiline: true,
    placeholder: "Leave empty to keep the default contact copy.",
  },
];

/** Returns every CMS block with the saved value (or the default). */
export async function getCmsBlocks(): Promise<CmsBlock[]> {
  const db = await getDb();
  const rows = await db.select().from(cmsContent);
  const byKey = new Map(rows.map((row) => [row.key, row.value]));
  return CMS_BLOCKS.map((block) => ({
    ...block,
    value: byKey.get(block.key) ?? block.value,
  }));
}

/** Saved-value lookup for the public site (returns only non-empty overrides). */
export async function getCmsValues(): Promise<Record<string, string>> {
  const db = await getDb();
  const rows = await db.select().from(cmsContent);
  return Object.fromEntries(rows.filter((row) => row.value).map((row) => [row.key, row.value]));
}

export async function setCmsBlock(key: string, value: string, actorId: string): Promise<void> {
  const block = CMS_BLOCKS.find((item) => item.key === key);
  if (!block) throw new Error(`Unknown CMS block: ${key}`);
  const db = await getDb();
  const [existing] = await db.select().from(cmsContent).where(eq(cmsContent.key, key)).limit(1);
  if (existing) {
    await db
      .update(cmsContent)
      .set({ value, updatedBy: actorId, updatedAt: new Date() })
      .where(eq(cmsContent.key, key));
  } else {
    await db.insert(cmsContent).values({
      key,
      label: block.label,
      section: block.section,
      value,
      updatedBy: actorId,
    });
  }
}

/* -------------------------------------------------------------------------- */
/*  Testimonials                                                               */
/* -------------------------------------------------------------------------- */

export interface TestimonialInput {
  name?: string;
  role?: string;
  quote?: string;
  avatarUrl?: string;
  rating?: number;
  isPublished?: boolean;
  sortOrder?: number;
}

export async function listTestimonials() {
  const db = await getDb();
  return db.select().from(testimonials).orderBy(asc(testimonials.sortOrder), asc(testimonials.createdAt));
}

export async function listPublishedTestimonials() {
  const db = await getDb();
  return db
    .select()
    .from(testimonials)
    .where(eq(testimonials.isPublished, true))
    .orderBy(asc(testimonials.sortOrder), asc(testimonials.createdAt));
}

export async function createTestimonial(input: TestimonialInput & { name: string; quote: string }, actorId: string) {
  const db = await getDb();
  const [created] = await db
    .insert(testimonials)
    .values({
      name: input.name.trim(),
      role: input.role?.trim() ?? "",
      quote: input.quote.trim(),
      avatarUrl: input.avatarUrl?.trim() ?? "",
      rating: Math.min(5, Math.max(1, input.rating ?? 5)),
      isPublished: input.isPublished ?? true,
      sortOrder: input.sortOrder ?? 0,
      createdBy: actorId,
    })
    .returning();
  return created;
}

export async function updateTestimonial(id: string, input: TestimonialInput) {
  const db = await getDb();
  const [existing] = await db.select().from(testimonials).where(eq(testimonials.id, id)).limit(1);
  if (!existing) return null;

  const patch: Record<string, unknown> = { updatedAt: new Date() };
  if (input.name !== undefined) patch.name = input.name.trim();
  if (input.role !== undefined) patch.role = input.role.trim();
  if (input.quote !== undefined) patch.quote = input.quote.trim();
  if (input.avatarUrl !== undefined) patch.avatarUrl = input.avatarUrl.trim();
  if (input.rating !== undefined) patch.rating = Math.min(5, Math.max(1, input.rating));
  if (input.isPublished !== undefined) patch.isPublished = input.isPublished;
  if (input.sortOrder !== undefined) patch.sortOrder = input.sortOrder;

  const [updated] = await db.update(testimonials).set(patch).where(eq(testimonials.id, id)).returning();
  return updated ?? null;
}

export async function deleteTestimonial(id: string): Promise<boolean> {
  const db = await getDb();
  const [deleted] = await db.delete(testimonials).where(eq(testimonials.id, id)).returning({ id: testimonials.id });
  return Boolean(deleted);
}

/* -------------------------------------------------------------------------- */
/*  FAQs                                                                       */
/* -------------------------------------------------------------------------- */

export interface FaqInput {
  question?: string;
  answer?: string;
  category?: string;
  isPublished?: boolean;
  sortOrder?: number;
}

export async function listFaqs() {
  const db = await getDb();
  return db.select().from(faqs).orderBy(asc(faqs.sortOrder), asc(faqs.createdAt));
}

export async function listPublishedFaqs(category?: string) {
  const db = await getDb();
  const rows = await db
    .select()
    .from(faqs)
    .where(eq(faqs.isPublished, true))
    .orderBy(asc(faqs.sortOrder), asc(faqs.createdAt));
  return category ? rows.filter((row) => row.category === category) : rows;
}

export async function createFaq(input: FaqInput & { question: string; answer: string }, actorId: string) {
  const db = await getDb();
  const [created] = await db
    .insert(faqs)
    .values({
      question: input.question.trim(),
      answer: input.answer.trim(),
      category: input.category?.trim() || "general",
      isPublished: input.isPublished ?? true,
      sortOrder: input.sortOrder ?? 0,
      createdBy: actorId,
    })
    .returning();
  return created;
}

export async function updateFaq(id: string, input: FaqInput) {
  const db = await getDb();
  const [existing] = await db.select().from(faqs).where(eq(faqs.id, id)).limit(1);
  if (!existing) return null;

  const patch: Record<string, unknown> = { updatedAt: new Date() };
  if (input.question !== undefined) patch.question = input.question.trim();
  if (input.answer !== undefined) patch.answer = input.answer.trim();
  if (input.category !== undefined) patch.category = input.category.trim() || "general";
  if (input.isPublished !== undefined) patch.isPublished = input.isPublished;
  if (input.sortOrder !== undefined) patch.sortOrder = input.sortOrder;

  const [updated] = await db.update(faqs).set(patch).where(eq(faqs.id, id)).returning();
  return updated ?? null;
}

export async function deleteFaq(id: string): Promise<boolean> {
  const db = await getDb();
  const [deleted] = await db.delete(faqs).where(eq(faqs.id, id)).returning({ id: faqs.id });
  return Boolean(deleted);
}

/* -------------------------------------------------------------------------- */
/*  Announcements                                                              */
/* -------------------------------------------------------------------------- */

export interface AnnouncementInput {
  title?: string;
  body?: string;
  tone?: string;
  isActive?: boolean;
  startsAt?: string | null;
  endsAt?: string | null;
}

export async function listAnnouncements() {
  const db = await getDb();
  return db.select().from(announcements).orderBy(asc(announcements.createdAt));
}

/** Active announcements for the public site banner (respects the schedule). */
export async function listActiveAnnouncements() {
  const db = await getDb();
  const rows = await db.select().from(announcements).where(eq(announcements.isActive, true));
  const now = Date.now();
  return rows.filter((row) => {
    if (row.startsAt && row.startsAt.getTime() > now) return false;
    if (row.endsAt && row.endsAt.getTime() < now) return false;
    return true;
  });
}

export async function createAnnouncement(input: AnnouncementInput & { title: string }, actorId: string) {
  const db = await getDb();
  const [created] = await db
    .insert(announcements)
    .values({
      title: input.title.trim(),
      body: input.body?.trim() ?? "",
      tone: input.tone ?? "info",
      isActive: input.isActive ?? true,
      startsAt: input.startsAt ? new Date(input.startsAt) : null,
      endsAt: input.endsAt ? new Date(input.endsAt) : null,
      createdBy: actorId,
    })
    .returning();
  return created;
}

export async function updateAnnouncement(id: string, input: AnnouncementInput) {
  const db = await getDb();
  const [existing] = await db.select().from(announcements).where(eq(announcements.id, id)).limit(1);
  if (!existing) return null;

  const patch: Record<string, unknown> = { updatedAt: new Date() };
  if (input.title !== undefined) patch.title = input.title.trim();
  if (input.body !== undefined) patch.body = input.body.trim();
  if (input.tone !== undefined) patch.tone = input.tone;
  if (input.isActive !== undefined) patch.isActive = input.isActive;
  if (input.startsAt !== undefined) patch.startsAt = input.startsAt ? new Date(input.startsAt) : null;
  if (input.endsAt !== undefined) patch.endsAt = input.endsAt ? new Date(input.endsAt) : null;

  const [updated] = await db.update(announcements).set(patch).where(eq(announcements.id, id)).returning();
  return updated ?? null;
}

export async function deleteAnnouncement(id: string): Promise<boolean> {
  const db = await getDb();
  const [deleted] = await db
    .delete(announcements)
    .where(eq(announcements.id, id))
    .returning({ id: announcements.id });
  return Boolean(deleted);
}

export const ANNOUNCEMENT_TONES = ["info", "success", "warning"] as const;
export const FAQ_CATEGORIES = ["general", "buying", "renting", "selling"] as const;
