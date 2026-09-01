import { and, asc, desc, eq, inArray, like, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { enquiries, enquiryNotes, properties, users } from "@/db/schema";
import type { AuthenticatedUser } from "@/lib/auth/session";
import { hasPermission } from "@/lib/rbac/can";

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

export interface EnquiryNoteRow {
  id: string;
  kind: string;
  userEmail: string;
  body: string;
  createdAt: string;
}

export interface EnquiryListItem {
  id: string;
  reference: string;
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  type: string;
  source: string;
  status: string;
  priority: string;
  propertyId: string | null;
  propertyTitle: string | null;
  customerId: string | null;
  assignedTo: string | null;
  assignedName: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface EnquiryDetail extends EnquiryListItem {
  thread: EnquiryNoteRow[];
}

export interface EnquiryInput {
  name?: string;
  email?: string;
  phone?: string;
  subject?: string;
  message?: string;
  type?: string;
  source?: string;
  status?: string;
  priority?: string;
  propertyId?: string | null;
  customerId?: string | null;
  assignedTo?: string | null;
}

export const ENQUIRY_STATUSES = ["new", "in_progress", "responded", "closed"] as const;
export const ENQUIRY_TYPES = ["general", "property", "viewing"] as const;
export const ENQUIRY_PRIORITIES = ["low", "normal", "high"] as const;

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

/** Generates the next human reference: ENQ-0001, ENQ-0002, … */
async function nextReference(): Promise<string> {
  const db = await getDb();
  const [row] = await db
    .select({ count: sql<number>`count(*)` })
    .from(enquiries);
  return `ENQ-${String((row?.count ?? 0) + 1).padStart(4, "0")}`;
}

async function assemble(rows: (typeof enquiries.$inferSelect)[]): Promise<EnquiryListItem[]> {
  if (rows.length === 0) return [];
  const db = await getDb();

  const propertyIds = [...new Set(rows.map((row) => row.propertyId).filter(Boolean))] as string[];
  const userIds = [...new Set(rows.map((row) => row.assignedTo).filter(Boolean))] as string[];

  const [propertyRows, userRows] = await Promise.all([
    propertyIds.length > 0
      ? db.select({ id: properties.id, title: properties.title }).from(properties).where(inArray(properties.id, propertyIds))
      : Promise.resolve([]),
    userIds.length > 0
      ? db
          .select({ id: users.id, firstName: users.firstName, lastName: users.lastName })
          .from(users)
          .where(inArray(users.id, userIds))
      : Promise.resolve([]),
  ]);

  const propertyTitleBy = new Map(propertyRows.map((row) => [row.id, row.title]));
  const userNameBy = new Map(userRows.map((row) => [row.id, `${row.firstName} ${row.lastName}`.trim()]));

  return rows.map((row) => ({
    id: row.id,
    reference: row.reference,
    name: row.name,
    email: row.email,
    phone: row.phone,
    subject: row.subject,
    message: row.message,
    type: row.type,
    source: row.source,
    status: row.status,
    priority: row.priority,
    propertyId: row.propertyId,
    propertyTitle: row.propertyId ? (propertyTitleBy.get(row.propertyId) ?? null) : null,
    customerId: row.customerId,
    assignedTo: row.assignedTo,
    assignedName: row.assignedTo ? (userNameBy.get(row.assignedTo) ?? null) : null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }));
}

/* -------------------------------------------------------------------------- */
/*  Reads                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Scoped read: `enquiry:read` sees everything; `enquiry:property_read` sees
 * enquiries tied to a property; `enquiry:assigned_read` sees those assigned to
 * the caller. Any combination unions together.
 */
export async function loadEnquiriesForUser(user: AuthenticatedUser): Promise<EnquiryListItem[]> {
  const db = await getDb();
  const rows = await db.select().from(enquiries).orderBy(desc(enquiries.createdAt));

  let visible = rows;
  if (!hasPermission(user.permissions, "enquiry:read")) {
    const canProperty = hasPermission(user.permissions, "enquiry:property_read");
    const canAssigned = hasPermission(user.permissions, "enquiry:assigned_read");
    visible = rows.filter((row) => {
      if (canAssigned && row.assignedTo === user.id) return true;
      if (canProperty && row.propertyId) return true;
      return false;
    });
  }

  return assemble(visible);
}

export async function getEnquiryById(id: string): Promise<EnquiryListItem | null> {
  const db = await getDb();
  const [row] = await db.select().from(enquiries).where(eq(enquiries.id, id)).limit(1);
  if (!row) return null;
  return (await assemble([row]))[0];
}

export async function getEnquiryDetails(id: string): Promise<EnquiryDetail | null> {
  const db = await getDb();
  const [row] = await db.select().from(enquiries).where(eq(enquiries.id, id)).limit(1);
  if (!row) return null;

  const notes = await db
    .select()
    .from(enquiryNotes)
    .where(eq(enquiryNotes.enquiryId, id))
    .orderBy(asc(enquiryNotes.createdAt));

  return {
    ...(await assemble([row]))[0],
    thread: notes.map((note) => ({
      id: note.id,
      kind: note.kind,
      userEmail: note.userEmail,
      body: note.body,
      createdAt: note.createdAt.toISOString(),
    })),
  };
}

/* -------------------------------------------------------------------------- */
/*  Writes                                                                     */
/* -------------------------------------------------------------------------- */

export async function createEnquiry(
  input: EnquiryInput & { name: string },
  actorId: string | null
): Promise<EnquiryListItem> {
  const db = await getDb();
  const [created] = await db
    .insert(enquiries)
    .values({
      reference: await nextReference(),
      name: input.name.trim(),
      email: input.email?.trim() ?? "",
      phone: input.phone?.trim() ?? "",
      subject: input.subject?.trim() ?? "",
      message: input.message?.trim() ?? "",
      type: input.type ?? "general",
      source: input.source ?? "website",
      status: input.status ?? "new",
      priority: input.priority ?? "normal",
      propertyId: input.propertyId ?? null,
      customerId: input.customerId ?? null,
      assignedTo: input.assignedTo ?? null,
      createdBy: actorId,
    })
    .returning();
  return (await assemble([created]))[0];
}

export async function updateEnquiry(id: string, input: EnquiryInput): Promise<EnquiryListItem | null> {
  const db = await getDb();
  const [existing] = await db.select().from(enquiries).where(eq(enquiries.id, id)).limit(1);
  if (!existing) return null;

  const patch: Record<string, unknown> = { updatedAt: new Date() };
  if (input.name !== undefined) patch.name = input.name.trim();
  if (input.email !== undefined) patch.email = input.email.trim();
  if (input.phone !== undefined) patch.phone = input.phone.trim();
  if (input.subject !== undefined) patch.subject = input.subject.trim();
  if (input.message !== undefined) patch.message = input.message;
  if (input.type !== undefined) patch.type = input.type;
  if (input.source !== undefined) patch.source = input.source;
  if (input.status !== undefined) patch.status = input.status;
  if (input.priority !== undefined) patch.priority = input.priority;
  if (input.propertyId !== undefined) patch.propertyId = input.propertyId;
  if (input.customerId !== undefined) patch.customerId = input.customerId;
  if (input.assignedTo !== undefined) patch.assignedTo = input.assignedTo;

  const [updated] = await db.update(enquiries).set(patch).where(eq(enquiries.id, id)).returning();
  return updated ? (await assemble([updated]))[0] : null;
}

export async function setEnquiryStatus(id: string, status: string): Promise<EnquiryListItem | null> {
  return updateEnquiry(id, { status });
}

export async function deleteEnquiry(id: string): Promise<boolean> {
  const db = await getDb();
  const [deleted] = await db.delete(enquiries).where(eq(enquiries.id, id)).returning({ id: enquiries.id });
  return Boolean(deleted);
}

export async function addEnquiryNote(
  enquiryId: string,
  body: string,
  kind: "note" | "response",
  actor: Pick<AuthenticatedUser, "id" | "email">
): Promise<EnquiryNoteRow> {
  const db = await getDb();
  const [created] = await db
    .insert(enquiryNotes)
    .values({ enquiryId, userId: actor.id, userEmail: actor.email, body, kind })
    .returning();
  return {
    id: created.id,
    kind: created.kind,
    userEmail: created.userEmail,
    body: created.body,
    createdAt: created.createdAt.toISOString(),
  };
}
