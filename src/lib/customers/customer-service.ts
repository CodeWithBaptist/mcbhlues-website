import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { getDb } from "@/db";
import {
  bookings,
  customerNotes,
  customers,
  customerSavedProperties,
  enquiries,
  properties,
} from "@/db/schema";
import type { AuthenticatedUser } from "@/lib/auth/session";
import { hasPermission } from "@/lib/rbac/can";

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

export interface CustomerNoteRow {
  id: string;
  userEmail: string;
  body: string;
  createdAt: string;
}

export interface CustomerListItem {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  type: string;
  status: string;
  source: string;
  budgetMin: number;
  budgetMax: number;
  preferredLocation: string;
  notes: string;
  assignedTo: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerDetail extends CustomerListItem {
  internalNotes: CustomerNoteRow[];
  savedPropertyIds: string[];
  enquiries: CustomerEnquiryRow[];
  bookings: CustomerBookingRow[];
}

export interface CustomerEnquiryRow {
  id: string;
  reference: string;
  subject: string;
  status: string;
  createdAt: string;
}

export interface CustomerBookingRow {
  id: string;
  reference: string;
  type: string;
  status: string;
  scheduledAt: string;
}

export interface CustomerInput {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  type?: string;
  status?: string;
  source?: string;
  budgetMin?: number;
  budgetMax?: number;
  preferredLocation?: string;
  notes?: string;
  assignedTo?: string | null;
}

/* -------------------------------------------------------------------------- */
/*  Reads                                                                      */
/* -------------------------------------------------------------------------- */

function toListItem(row: typeof customers.$inferSelect): CustomerListItem {
  return {
    id: row.id,
    firstName: row.firstName,
    lastName: row.lastName,
    email: row.email,
    phone: row.phone,
    type: row.type,
    status: row.status,
    source: row.source,
    budgetMin: row.budgetMin,
    budgetMax: row.budgetMax,
    preferredLocation: row.preferredLocation,
    notes: row.notes,
    assignedTo: row.assignedTo,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

/**
 * Lists the customers the caller may see: `customer:read` sees everyone,
 * otherwise `customer:assigned_read` restricts the list to customers assigned
 * to the caller.
 */
export async function loadCustomersForUser(user: AuthenticatedUser): Promise<CustomerListItem[]> {
  const db = await getDb();
  const canSeeAll = hasPermission(user.permissions, "customer:read");
  const rows = await db.select().from(customers).orderBy(asc(customers.createdAt));
  if (canSeeAll) return rows.map(toListItem);
  return rows.filter((row) => row.assignedTo === user.id).map(toListItem);
}

export async function getCustomerById(id: string): Promise<CustomerListItem | null> {
  const db = await getDb();
  const [row] = await db.select().from(customers).where(eq(customers.id, id)).limit(1);
  return row ? toListItem(row) : null;
}

/** Full customer 360° view: notes, saved properties, enquiries, bookings. */
export async function getCustomerDetails(id: string): Promise<CustomerDetail | null> {
  const db = await getDb();
  const [row] = await db.select().from(customers).where(eq(customers.id, id)).limit(1);
  if (!row) return null;

  const [noteRows, savedRows, enquiryRows, bookingRows] = await Promise.all([
    db.select().from(customerNotes).where(eq(customerNotes.customerId, id)).orderBy(desc(customerNotes.createdAt)),
    db.select().from(customerSavedProperties).where(eq(customerSavedProperties.customerId, id)),
    db
      .select()
      .from(enquiries)
      .where(eq(enquiries.customerId, id))
      .orderBy(desc(enquiries.createdAt)),
    db
      .select()
      .from(bookings)
      .where(eq(bookings.customerId, id))
      .orderBy(desc(bookings.scheduledAt)),
  ]);

  return {
    ...toListItem(row),
    internalNotes: noteRows.map((note) => ({
      id: note.id,
      userEmail: note.userEmail,
      body: note.body,
      createdAt: note.createdAt.toISOString(),
    })),
    savedPropertyIds: savedRows.map((saved) => saved.propertyId),
    enquiries: enquiryRows.map((enquiry) => ({
      id: enquiry.id,
      reference: enquiry.reference,
      subject: enquiry.subject,
      status: enquiry.status,
      createdAt: enquiry.createdAt.toISOString(),
    })),
    bookings: bookingRows.map((booking) => ({
      id: booking.id,
      reference: booking.reference,
      type: booking.type,
      status: booking.status,
      scheduledAt: booking.scheduledAt.toISOString(),
    })),
  };
}

/* -------------------------------------------------------------------------- */
/*  Writes                                                                     */
/* -------------------------------------------------------------------------- */

export async function createCustomer(
  input: CustomerInput & { firstName: string },
  actorId: string
): Promise<CustomerListItem> {
  const db = await getDb();
  const [created] = await db
    .insert(customers)
    .values({
      firstName: input.firstName.trim(),
      lastName: input.lastName?.trim() ?? "",
      email: input.email?.trim() ?? "",
      phone: input.phone?.trim() ?? "",
      type: input.type ?? "buyer",
      status: input.status ?? "active",
      source: input.source?.trim() ?? "",
      budgetMin: input.budgetMin ?? 0,
      budgetMax: input.budgetMax ?? 0,
      preferredLocation: input.preferredLocation?.trim() ?? "",
      notes: input.notes ?? "",
      assignedTo: input.assignedTo ?? null,
      createdBy: actorId,
    })
    .returning();
  return toListItem(created);
}

export async function updateCustomer(
  id: string,
  input: CustomerInput
): Promise<CustomerListItem | null> {
  const db = await getDb();
  const [existing] = await db.select().from(customers).where(eq(customers.id, id)).limit(1);
  if (!existing) return null;

  const patch: Record<string, unknown> = { updatedAt: new Date() };
  if (input.firstName !== undefined) patch.firstName = input.firstName.trim();
  if (input.lastName !== undefined) patch.lastName = input.lastName.trim();
  if (input.email !== undefined) patch.email = input.email.trim();
  if (input.phone !== undefined) patch.phone = input.phone.trim();
  if (input.type !== undefined) patch.type = input.type;
  if (input.status !== undefined) patch.status = input.status;
  if (input.source !== undefined) patch.source = input.source.trim();
  if (input.budgetMin !== undefined) patch.budgetMin = input.budgetMin;
  if (input.budgetMax !== undefined) patch.budgetMax = input.budgetMax;
  if (input.preferredLocation !== undefined) patch.preferredLocation = input.preferredLocation.trim();
  if (input.notes !== undefined) patch.notes = input.notes;
  if (input.assignedTo !== undefined) patch.assignedTo = input.assignedTo;

  const [updated] = await db.update(customers).set(patch).where(eq(customers.id, id)).returning();
  return updated ? toListItem(updated) : null;
}

export async function deleteCustomer(id: string): Promise<boolean> {
  const db = await getDb();
  const [deleted] = await db.delete(customers).where(eq(customers.id, id)).returning({ id: customers.id });
  return Boolean(deleted);
}

/* -------------------------------------------------------------------------- */
/*  Notes & saved properties                                                   */
/* -------------------------------------------------------------------------- */

export async function addCustomerNote(
  customerId: string,
  body: string,
  actor: Pick<AuthenticatedUser, "id" | "email">
): Promise<CustomerNoteRow> {
  const db = await getDb();
  const [created] = await db
    .insert(customerNotes)
    .values({ customerId, userId: actor.id, userEmail: actor.email, body })
    .returning();
  return {
    id: created.id,
    userEmail: created.userEmail,
    body: created.body,
    createdAt: created.createdAt.toISOString(),
  };
}

export async function setCustomerSavedProperties(customerId: string, propertyIds: string[]): Promise<void> {
  const db = await getDb();
  await db.delete(customerSavedProperties).where(eq(customerSavedProperties.customerId, customerId));
  const unique = [...new Set(propertyIds)].filter(Boolean);
  if (unique.length > 0) {
    await db
      .insert(customerSavedProperties)
      .values(unique.map((propertyId) => ({ customerId, propertyId })))
      .onConflictDoNothing();
  }
}

/** Lightweight property picker options for the "saved properties" editor. */
export async function listPropertyOptions(): Promise<{ id: string; title: string; city: string }[]> {
  const db = await getDb();
  const rows = await db
    .select({ id: properties.id, title: properties.title, city: properties.city })
    .from(properties)
    .orderBy(asc(properties.title));
  return rows;
}

export const CUSTOMER_TYPES = ["buyer", "renter", "investor", "seller"] as const;
export const CUSTOMER_STATUSES = ["active", "lead", "inactive"] as const;
