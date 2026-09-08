import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { subscribers } from "@/db/schema";

/**
 * Newsletter subscriber persistence.
 *
 * Sign-ups are real records, never a client-side acknowledgement: the popup
 * only reports success once the address is durably stored here. That is what
 * keeps the "you're on the list" state honest.
 */

export interface AddSubscriberResult {
  id: string;
  /**
   * `true` when this address was already on the list. Callers use it to say
   * "you're already subscribed" rather than pretending a new record was made.
   */
  alreadySubscribed: boolean;
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
    if (current.status !== "active") {
      await db
        .update(subscribers)
        .set({ status: "active", unsubscribedAt: null, updatedAt: new Date() })
        .where(eq(subscribers.id, current.id));
    }
    return { id: current.id, alreadySubscribed: true };
  }

  try {
    const [created] = await db
      .insert(subscribers)
      .values({ email, source })
      .returning({ id: subscribers.id });
    return { id: created.id, alreadySubscribed: false };
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
    return { id: raced[0].id, alreadySubscribed: true };
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
