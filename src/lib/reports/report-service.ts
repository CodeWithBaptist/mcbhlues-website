import { count, desc, gte, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { activityLogs, auditLogs, bookings, customers, enquiries, properties, users } from "@/db/schema";

export interface NamedCount {
  label: string;
  value: number;
}

export interface ReportData {
  totals: { label: string; value: number }[];
  propertiesByStatus: NamedCount[];
  propertiesByType: NamedCount[];
  enquiriesByStatus: NamedCount[];
  enquiriesByType: NamedCount[];
  bookingsByStatus: NamedCount[];
  customersByType: NamedCount[];
  recentActivity: { action: string; userEmail: string; description: string; createdAt: string }[];
  upcomingBookings: {
    id: string;
    reference: string;
    name: string;
    type: string;
    status: string;
    scheduledAt: string;
  }[];
}

function groupBy<T>(rows: T[], pick: (row: T) => string): NamedCount[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const key = pick(row) || "unknown";
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return [...map.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);
}

/** Aggregates the operational stats rendered on the Reports page. */
export async function buildReport(): Promise<ReportData> {
  const db = await getDb();

  const [
    propertyRows,
    enquiryRows,
    bookingRows,
    customerRows,
    [staffCount],
    activityRows,
    upcomingRows,
  ] = await Promise.all([
    db.select({ status: properties.status, type: properties.type, isPublished: properties.isPublished }).from(properties),
    db.select({ status: enquiries.status, type: enquiries.type }).from(enquiries),
    db.select({ status: bookings.status }).from(bookings),
    db.select({ type: customers.type }).from(customers),
    db.select({ value: count() }).from(users),
    db
      .select({
        action: activityLogs.action,
        userEmail: activityLogs.userEmail,
        description: activityLogs.description,
        createdAt: activityLogs.createdAt,
      })
      .from(activityLogs)
      .orderBy(desc(activityLogs.createdAt))
      .limit(8),
    db
      .select({
        id: bookings.id,
        reference: bookings.reference,
        name: bookings.name,
        type: bookings.type,
        status: bookings.status,
        scheduledAt: bookings.scheduledAt,
      })
      .from(bookings)
      .where(gte(bookings.scheduledAt, sql`now()`))
      .orderBy(bookings.scheduledAt)
      .limit(6),
  ]);

  return {
    totals: [
      { label: "Properties", value: propertyRows.length },
      { label: "Customers", value: customerRows.length },
      { label: "Enquiries", value: enquiryRows.length },
      { label: "Bookings", value: bookingRows.length },
      { label: "Staff accounts", value: staffCount?.value ?? 0 },
    ],
    propertiesByStatus: groupBy(propertyRows, (row) => row.status),
    propertiesByType: groupBy(propertyRows, (row) => (row.type === "rent" ? "For rent" : "For sale")),
    enquiriesByStatus: groupBy(enquiryRows, (row) => row.status.replace(/_/g, " ")),
    enquiriesByType: groupBy(enquiryRows, (row) => row.type),
    bookingsByStatus: groupBy(bookingRows, (row) => row.status),
    customersByType: groupBy(customerRows, (row) => row.type),
    recentActivity: activityRows.map((row) => ({
      action: row.action,
      userEmail: row.userEmail,
      description: row.description,
      createdAt: row.createdAt.toISOString(),
    })),
    upcomingBookings: upcomingRows.map((row) => ({
      id: row.id,
      reference: row.reference,
      name: row.name,
      type: row.type,
      status: row.status,
      scheduledAt: row.scheduledAt.toISOString(),
    })),
  };
}
