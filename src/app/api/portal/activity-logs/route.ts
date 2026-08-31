import { NextResponse } from "next/server";
import { desc } from "drizzle-orm";
import { getDb } from "@/db";
import { activityLogs } from "@/db/schema";
import { withPermission } from "@/lib/rbac/api-guard";

/** GET /api/portal/activity-logs — requires activity:read */
export const GET = withPermission("activity:read", async (request) => {
  const limit = Math.min(Number(request.nextUrl.searchParams.get("limit") ?? 100), 500);
  const db = await getDb();
  const rows = await db.select().from(activityLogs).orderBy(desc(activityLogs.createdAt)).limit(limit);
  return NextResponse.json({ logs: rows });
});
