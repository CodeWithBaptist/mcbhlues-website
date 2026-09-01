import { asc, desc, eq, inArray, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { bookings, properties, users } from "@/db/schema";
import type { AuthenticatedUser } from "@/lib/auth/session";
import { hasPermission } from "@/lib/rbac/can";

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

export interface BookingListItem {
  id: string;
  reference: string;
  type: string;
  status: string;
  name: string;
  email: string;
  phone: string;
  propertyId: string | null;
  propertyTitle: string | null;
  customerId: string | null;
  assignedTo: string | null;
  assignedName: string | null;
  scheduledAt: string;
  durationMinutes: number;
  location: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface BookingInput {
  type?: string;
  status?: string;
  name?: string;
  email?: string;
  phone?: string;
  propertyId?: string | null;
  customerId?: string | null;
  assignedTo?: string | null;
  scheduledAt?: string;
  durationMinutes?: number;
  location?: string;
  notes?: string;
}

export const BOOKING_TYPES = ["viewing", "consultation", "inspection"] as const;
export const BOOKING_STATUSES = ["pending", "confirmed", "completed", "cancelled", "rejected"] as const;

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

/** Generates the next human reference: BKG-0001, BKG-0002, … */
async function nextReference(): Promise<string> {
  const db = await getDb();
  const [row] = await db.select({ count: sql<number>`count(*)` }).from(bookings);
  return `BKG-${String((row?.count ?? 0) + 1).padStart(4, "0")}`;
}

async function assemble(rows: (typeof bookings.$inferSelect)[]): Promise<BookingListItem[]> {
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
    type: row.type,
    status: row.status,
    name: row.name,
    email: row.email,
    phone: row.phone,
    propertyId: row.propertyId,
    propertyTitle: row.propertyId ? (propertyTitleBy.get(row.propertyId) ?? null) : null,
    customerId: row.customerId,
    assignedTo: row.assignedTo,
    assignedName: row.assignedTo ? (userNameBy.get(row.assignedTo) ?? null) : null,
    scheduledAt: row.scheduledAt.toISOString(),
    durationMinutes: row.durationMinutes,
    location: row.location,
    notes: row.notes,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }));
}

/* -------------------------------------------------------------------------- */
/*  Reads                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Scoped read: `booking:read` sees everything; `booking:property_read` sees
 * bookings tied to a property; `booking:assigned_read` those assigned to the
 * caller.
 */
export async function loadBookingsForUser(user: AuthenticatedUser): Promise<BookingListItem[]> {
  const db = await getDb();
  const rows = await db.select().from(bookings).orderBy(asc(bookings.scheduledAt));

  let visible = rows;
  if (!hasPermission(user.permissions, "booking:read")) {
    const canProperty = hasPermission(user.permissions, "booking:property_read");
    const canAssigned = hasPermission(user.permissions, "booking:assigned_read");
    visible = rows.filter((row) => {
      if (canAssigned && row.assignedTo === user.id) return true;
      if (canProperty && row.propertyId) return true;
      return false;
    });
  }

  return assemble(visible);
}

export async function getBookingById(id: string): Promise<BookingListItem | null> {
  const db = await getDb();
  const [row] = await db.select().from(bookings).where(eq(bookings.id, id)).limit(1);
  if (!row) return null;
  return (await assemble([row]))[0];
}

/* -------------------------------------------------------------------------- */
/*  Writes                                                                     */
/* -------------------------------------------------------------------------- */

export async function createBooking(
  input: BookingInput & { name: string; scheduledAt: string },
  actorId: string | null
): Promise<BookingListItem> {
  const db = await getDb();
  const [created] = await db
    .insert(bookings)
    .values({
      reference: await nextReference(),
      type: input.type ?? "viewing",
      status: input.status ?? "pending",
      name: input.name.trim(),
      email: input.email?.trim() ?? "",
      phone: input.phone?.trim() ?? "",
      propertyId: input.propertyId ?? null,
      customerId: input.customerId ?? null,
      assignedTo: input.assignedTo ?? null,
      scheduledAt: new Date(input.scheduledAt),
      durationMinutes: input.durationMinutes ?? 60,
      location: input.location?.trim() ?? "",
      notes: input.notes ?? "",
      createdBy: actorId,
    })
    .returning();
  return (await assemble([created]))[0];
}

export async function updateBooking(id: string, input: BookingInput): Promise<BookingListItem | null> {
  const db = await getDb();
  const [existing] = await db.select().from(bookings).where(eq(bookings.id, id)).limit(1);
  if (!existing) return null;

  const patch: Record<string, unknown> = { updatedAt: new Date() };
  if (input.type !== undefined) patch.type = input.type;
  if (input.status !== undefined) patch.status = input.status;
  if (input.name !== undefined) patch.name = input.name.trim();
  if (input.email !== undefined) patch.email = input.email.trim();
  if (input.phone !== undefined) patch.phone = input.phone.trim();
  if (input.propertyId !== undefined) patch.propertyId = input.propertyId;
  if (input.customerId !== undefined) patch.customerId = input.customerId;
  if (input.assignedTo !== undefined) patch.assignedTo = input.assignedTo;
  if (input.scheduledAt !== undefined) patch.scheduledAt = new Date(input.scheduledAt);
  if (input.durationMinutes !== undefined) patch.durationMinutes = input.durationMinutes;
  if (input.location !== undefined) patch.location = input.location.trim();
  if (input.notes !== undefined) patch.notes = input.notes;

  const [updated] = await db.update(bookings).set(patch).where(eq(bookings.id, id)).returning();
  return updated ? (await assemble([updated]))[0] : null;
}

export async function deleteBooking(id: string): Promise<boolean> {
  const db = await getDb();
  const [deleted] = await db.delete(bookings).where(eq(bookings.id, id)).returning({ id: bookings.id });
  return Boolean(deleted);
}
