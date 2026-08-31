import { NextResponse } from "next/server";
import { desc } from "drizzle-orm";
import { getDb } from "@/db";
import { auditLogs } from "@/db/schema";
import { withPermission } from "@/lib/rbac/api-guard";

/** GET /api/portal/audit-logs — requires audit:read */
export const GET = withPermission("audit:read", async (request) => {
  const limit = Math.min(Number(request.nextUrl.searchParams.get("limit") ?? 100), 500);
  const db = await getDb();
  const rows = await db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(limit);
  return NextResponse.json({ logs: rows });
});
