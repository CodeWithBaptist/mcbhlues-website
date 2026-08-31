import { NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { permissions } from "@/db/schema";
import { withPermission } from "@/lib/rbac/api-guard";
import { AUDIT_ACTIONS, recordAudit } from "@/lib/rbac/audit";

/** GET /api/portal/permissions — requires permission:read */
export const GET = withPermission("permission:read", async () => {
  const db = await getDb();
  const rows = await db.select().from(permissions).orderBy(asc(permissions.module), asc(permissions.key));
  return NextResponse.json({ permissions: rows });
});

/**
 * POST /api/portal/permissions — register a brand new custom permission so the
 * catalogue can grow without a code change. Requires permission:update.
 */
export const POST = withPermission("permission:update", async (request, { user }) => {
  const body = await request.json().catch(() => null);
  const key = String(body?.key ?? "").trim().toLowerCase();
  const moduleName = String(body?.module ?? "Custom").trim() || "Custom";
  const description = String(body?.description ?? "").trim();

  if (!/^[a-z0-9_]+:[a-z0-9_]+$/.test(key)) {
    return NextResponse.json(
      { error: "Permission keys must look like resource:action (lowercase, underscores allowed)." },
      { status: 400 }
    );
  }

  const db = await getDb();
  const [existing] = await db.select().from(permissions).where(eq(permissions.key, key)).limit(1);
  if (existing) return NextResponse.json({ error: "That permission already exists." }, { status: 409 });

  const [resource, action] = key.split(":");
  const [created] = await db
    .insert(permissions)
    .values({ key, resource, action, module: moduleName, description, isSystem: false })
    .returning();

  await recordAudit({
    actor: user,
    action: AUDIT_ACTIONS.PERMISSION_CREATED,
    resource: "permission",
    resourceId: created.id,
    metadata: { key, module: moduleName },
  });

  return NextResponse.json({ permission: created }, { status: 201 });
});
