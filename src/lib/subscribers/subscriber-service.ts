import { desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { customers, subscribers } from "@/db/schema";

/**
 * Newsletter subscriber persistence.
 *
 * Sign-ups are real records, never a client-side acknowledgement: the hero form
 * only reports success once the address is durably stored here. That is what
 * keeps the "you're on the list" state honest.
 *
 * Every read the Staff Portal needs (the Newsletter screen, its counts, the
 * row-level status change) lives here too, so the list a manager sees is the
 * list the site wrote.
 */

/** Mirrors the `status` column's two states. */
export type SubscriberStatus = "active" | "unsubscribed";

export interface AddSubscriberResult {
  id: string;
  /**
   * `true` when this address was already on the list. Callers use it to say
   * "you're already subscribed" rather than pretending a new record was made.
   */
  alreadySubscribed: boolean;
  /**
   * `true` when an address that had opted out is back on the list. The welcome
   * email is sent for these too — someone who left and returned still needs to
   * see that the re-subscription worked.
   */
  reactivated: boolean;
  /** Status the row carries after this call. */
  status: SubscriberStatus;
}

/**
 * Add an address to the list, or re-activate one that had unsubscribed.
 *
 * The address must already have been through `normaliseSubscriberEmail` so it
 * is lower-cased — the unique index is case-sensitive, so lower-casing is what
 * makes "one row per person" true.
 */
export async function addSubscriber(
  email: string,
  source = "website"
): Promise<AddSubscriberResult> {
  const db = await getDb();

  const existing = await db
    .select({ id: subscribers.id, status: subscribers.status })
    .from(subscribers)
    .where(eq(subscribers.email, email))
    .limit(1);

  const current = existing[0];

  if (current) {
    // A returning subscriber who previously opted out is switched back on
    // instead of getting a second row.
    const reactivated = current.status !== "active";
    if (reactivated) {
      await db
        .update(subscribers)
        .set({ status: "active", unsubscribedAt: null, updatedAt: new Date() })
        .where(eq(subscribers.id, current.id));
    }
    return { id: current.id, alreadySubscribed: true, reactivated, status: "active" };
  }

  try {
    const [created] = await db
      .insert(subscribers)
      .values({ email, source })
      .returning({ id: subscribers.id });
    return { id: created.id, alreadySubscribed: false, reactivated: false, status: "active" };
  } catch (error) {
    // Two identical submissions arriving at once: one wins the insert and the
    // other trips the unique index. Re-read so the loser still answers
    // truthfully instead of surfacing a database error to the visitor.
    const raced = await db
      .select({ id: subscribers.id })
      .from(subscribers)
      .where(eq(subscribers.email, email))
      .limit(1);
    if (!raced[0]) throw error;
    return {
      id: raced[0].id,
      alreadySubscribed: true,
      reactivated: false,
      status: "active",
    };
  }
}

/**
 * Remove an address from the list without deleting the record, so the
 * opt-out survives and is not silently undone by a later sign-up form.
 */
export async function unsubscribeSubscriber(email: string): Promise<boolean> {
  const db = await getDb();
  const updated = await db
    .update(subscribers)
    .set({ status: "unsubscribed", unsubscribedAt: new Date(), updatedAt: new Date() })
    .where(eq(subscribers.email, email))
    .returning({ id: subscribers.id });
  return updated.length > 0;
}

/* -------------------------------------------------------------------------- */
/*  Staff Portal reads                                                         */
/* -------------------------------------------------------------------------- */

/** One row of the Newsletter screen, already shaped for the browser. */
export interface SubscriberRow {
  id: string;
  email: string;
  source: string;
  status: SubscriberStatus;
  createdAt: string;
  updatedAt: string;
  unsubscribedAt: string | null;
  /** Set when the same address exists as a customer record. */
  customer: { id: string; name: string } | null;
}

export interface SubscriberSummary {
  total: number;
  active: number;
  unsubscribed: number;
  /** Addresses captured in the last 30 days. */
  last30Days: number;
}

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

function toRow(
  row: typeof subscribers.$inferSelect,
  // Nullable because the customer fields arrive through a LEFT JOIN.
  customer: { id: string; firstName: string | null; lastName: string | null } | null
): SubscriberRow {
  return {
    id: row.id,
    email: row.email,
    source: row.source,
    status: row.status === "unsubscribed" ? "unsubscribed" : "active",
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    unsubscribedAt: row.unsubscribedAt ? row.unsubscribedAt.toISOString() : null,
    customer: customer
      ? {
          id: customer.id,
          name: `${customer.firstName} ${customer.lastName}`.trim() || customer.id,
        }
      : null,
  };
}

/**
 * The whole list, newest first, with the matching customer record attached
 * where one exists.
 *
 * A subscriber list is small enough (thousands, not millions) to hand over in
 * one request, which is what lets the screen filter and search instantly
 * without a round trip per keystroke.
 */
export async function listSubscribers(limit = 2000): Promise<SubscriberRow[]> {
  const db = await getDb();

  const rows = await db
    .select({
      subscriber: subscribers,
      customerId: customers.id,
      customerFirstName: customers.firstName,
      customerLastName: customers.lastName,
    })
    .from(subscribers)
    .leftJoin(customers, eq(customers.email, subscribers.email))
    .orderBy(desc(subscribers.createdAt))
    .limit(limit);

  return rows.map(({ subscriber, customerId, customerFirstName, customerLastName }) =>
    toRow(
      subscriber,
      customerId ? { id: customerId, firstName: customerFirstName, lastName: customerLastName } : null
    )
  );
}

/** Counts shown above the list — derived from the same rows the table renders. */
export function summariseSubscribers(rows: SubscriberRow[]): SubscriberSummary {
  const cutoff = Date.now() - THIRTY_DAYS_MS;
  return {
    total: rows.length,
    active: rows.filter((row) => row.status === "active").length,
    unsubscribed: rows.filter((row) => row.status === "unsubscribed").length,
    last30Days: rows.filter((row) => Date.parse(row.createdAt) >= cutoff).length,
  };
}

/**
 * Flip an address between `active` and `unsubscribed` from the portal — the
 * staff-side half of "you can unsubscribe at any time". Deleting is avoided on
 * purpose: the record is the evidence someone asked to be left alone.
 */
export async function setSubscriberStatus(
  id: string,
  status: SubscriberStatus
): Promise<SubscriberRow | null> {
  const db = await getDb();
  const now = new Date();

  const [updated] = await db
    .update(subscribers)
    .set(
      status === "unsubscribed"
        ? { status, unsubscribedAt: now, updatedAt: now }
        : { status, unsubscribedAt: null, updatedAt: now }
    )
    .where(eq(subscribers.id, id))
    .returning();

  if (!updated) return null;
  return toRow(updated, null);
}
